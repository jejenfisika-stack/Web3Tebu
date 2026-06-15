'use client';

import * as tf from '@tensorflow/tfjs';
import {
  MODEL_URL, CLASS_CONFIG_URL, CLASS_NAMES,
  IMG_SIZE, OOD_THRESHOLD, WARN_THRESHOLD,
} from './config';

let _model = null;
let _config = null;
let _loading = null;

// Load LayersModel (bukan GraphModel) + warm-up sekali
export async function loadModel(onProgress) {
  if (_model) return _model;
  if (_loading) return _loading;

  _loading = (async () => {
    const model = await tf.loadLayersModel(MODEL_URL, {
      onProgress: (frac) => onProgress && onProgress(frac),
    });
    // Warm-up agar prediksi pertama tidak lambat
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
  if (top.prob < ood) status = 'ood';        // ditolak — bukan/diluar distribusi
  else if (top.prob < warn) status = 'low';  // confidence rendah

  return { top, all, status, threshold: { ood, warn } };
}
