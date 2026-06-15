'use client';

import * as tf from '@tensorflow/tfjs';
import {
  MODEL_URL, CLASS_CONFIG_URL, CLASS_NAMES,
  IMG_SIZE, OOD_THRESHOLD, WARN_THRESHOLD,
} from './config';

let _model = null;
let _config = null;
let _loading = null;

// Cache model di browser (IndexedDB) → kunjungan berikutnya instan, tak download ulang
const MODEL_CACHE_KEY = 'indexeddb://tebuscan-nasnetmobile-v6';

// status terakhir: 'cache' (dari IndexedDB) | 'network' (download HF)
export let lastLoadSource = null;

export async function loadModel(onProgress) {
  if (_model) return _model;
  if (_loading) return _loading;

  _loading = (async () => {
    let model;

    // 1) Coba muat dari cache IndexedDB (cepat, offline-friendly)
    try {
      model = await tf.loadLayersModel(MODEL_CACHE_KEY);
      lastLoadSource = 'cache';
      if (onProgress) onProgress(1);
    } catch {
      // 2) Belum ada di cache → unduh dari Hugging Face, lalu simpan ke cache
      model = await tf.loadLayersModel(MODEL_URL, {
        onProgress: (frac) => onProgress && onProgress(frac),
      });
      lastLoadSource = 'network';
      try {
        await model.save(MODEL_CACHE_KEY);
      } catch (e) {
        console.warn('Cache model gagal (tidak fatal):', e);
      }
    }

    // Warm-up sekali agar prediksi pertama tidak lambat
    const warm = tf.zeros([1, IMG_SIZE, IMG_SIZE, 3]);
    const out = model.predict(warm);
    out.dataSync();
    warm.dispose();
    out.dispose();

    _model = model;
    return model;
  })();

  return _loading;
}

// Bersihkan cache model (mis. saat update model baru)
export async function clearModelCache() {
  try {
    await tf.io.removeModel(MODEL_CACHE_KEY);
    return true;
  } catch {
    return false;
  }
}

// Ambil class_config.json dari Hugging Face (fallback ke config lokal)
export async function loadConfig() {
  if (_config) return _config;
  try {
    const res = await fetch(CLASS_CONFIG_URL, { cache: 'force-cache' });
    _config = await res.json();
  } catch {
    _config = {
      classNames: CLASS_NAMES,
      oodThreshold: OOD_THRESHOLD,
      warnThreshold: WARN_THRESHOLD,
    };
  }
  return _config;
}

// Preprocessing NASNetMobile → [-1, 1], 224x224
export function preprocess(imgEl) {
  return tf.tidy(() =>
    tf.browser
      .fromPixels(imgEl)
      .resizeBilinear([IMG_SIZE, IMG_SIZE])
      .toFloat()
      .div(127.5)
      .sub(1.0)
      .expandDims(0)
  );
}

// Klasifikasi 1 gambar → {top, all, status}
export async function classify(imgEl) {
  const model = await loadModel();
  const cfg = await loadConfig();

  const input = preprocess(imgEl);
  const logits = model.predict(input);
  const probs = await logits.data();
  input.dispose();
  logits.dispose();

  const names = cfg.classNames || CLASS_NAMES;
  const all = Array.from(probs)
    .map((p, i) => ({ name: names[i], prob: p }))
    .sort((a, b) => b.prob - a.prob);

  const top = all[0];
  const ood = cfg.oodThreshold ?? OOD_THRESHOLD;
  const warn = cfg.warnThreshold ?? WARN_THRESHOLD;

  let status = 'ok';
  if (top.prob < ood) status = 'ood';
  else if (top.prob < warn) status = 'low';

  return { top, all, status, threshold: { ood, warn } };
}
