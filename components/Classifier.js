'use client';

import { useEffect, useRef, useState } from 'react';
import { loadModel, classify, lastLoadSource } from '@/lib/model';
import { CLASS_INFO, CONTRACT_ADDRESS } from '@/lib/config';
import { saveDiagnosis } from '@/lib/web3';

export default function Classifier({ account }) {
  const [modelReady, setModelReady] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);   // user klik sebelum model siap
  const [drag, setDrag] = useState(false);
  const [chainMsg, setChainMsg] = useState('');
  const imgRef = useRef(null);
  const fileRef = useRef(null);

  // Preload model di latar belakang saat halaman dibuka
  useEffect(() => {
    loadModel((frac) => setLoadPct(Math.round(frac * 100)))
      .then(() => {
        setModelReady(true);
        setFromCache(lastLoadSource === 'cache');
      })
      .catch((e) => console.error('Gagal load model:', e));
  }, []);

  // Kalau user sudah menekan "Klasifikasikan" sebelum model siap → jalankan otomatis
  useEffect(() => {
    if (modelReady && pending) {
      setPending(false);
      runPredict();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelReady, pending]);

  function pickFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setResult(null);
    setChainMsg('');
    setPending(false);
    setImgUrl(URL.createObjectURL(file));
  }

  async function runPredict() {
    if (!imgRef.current) return;
    setBusy(true);
    setResult(null);
    try {
      if (!imgRef.current.complete) {
        await new Promise((r) => (imgRef.current.onload = r));
      }
      const res = await classify(imgRef.current);
      setResult(res);
    } catch (e) {
      console.error(e);
      alert('Gagal memprediksi: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  function handlePredictClick() {
    if (!modelReady) {
      // model masih loading → tandai pending, nanti auto-jalan
      setPending(true);
      return;
    }
    runPredict();
  }

  async function handleSaveChain() {
    if (!result || result.status === 'ood') return;
    setChainMsg('');
    try {
      const hash = await saveDiagnosis({
        label: result.top.name,
        confidence: result.top.prob,
      });
      setChainMsg(`✅ Tersimpan di blockchain. Tx: ${hash}`);
    } catch (e) {
      setChainMsg('⚠️ ' + e.message);
    }
  }

  const info = result ? CLASS_INFO[result.top.name] : null;
  const contractReady = CONTRACT_ADDRESS && CONTRACT_ADDRESS.length > 0;

  return (
    <>
      {/* Status model — tidak memblokir, hanya informatif */}
      {!modelReady ? (
        <div className="alert alert-info">
          <span className="spinner" />{' '}
          Menyiapkan model AI… {loadPct > 0 ? `${loadPct}%` : ''}{' '}
          <span style={{ opacity: 0.8 }}>
            (unduh ~20 MB sekali saja — Anda sudah bisa pilih gambar sambil menunggu)
          </span>
        </div>
      ) : (
        <div className="alert alert-info" style={{ background: '#122e1e', color: '#4ade80', borderColor: '#1f5132' }}>
          ✓ Model siap{fromCache ? ' (dari cache — instan)' : ''}. Silakan unggah gambar daun tebu.
        </div>
      )}

      {/* Upload */}
      <div className="card">
        <div
          className={`drop ${drag ? 'drag' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault(); setDrag(false);
            pickFile(e.dataTransfer.files[0]);
          }}
        >
          <div className="icon">🌿📷</div>
          <p><strong>Klik</strong> atau seret foto daun tebu ke sini</p>
          <p>Format JPG/PNG — hasil terbaik: daun jelas & fokus</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickFile(e.target.files[0])}
          />
        </div>

        {imgUrl && (
          <div className="preview-wrap" style={{ marginTop: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imgUrl}
              alt="preview daun tebu"
              className="preview"
              crossOrigin="anonymous"
            />
            <div className="preview-col">
              <div className="row" style={{ marginTop: 0 }}>
                <button
                  className="btn btn-primary"
                  onClick={handlePredictClick}
                  disabled={busy || pending}
                >
                  {busy
                    ? <><span className="spinner" /> Menganalisis…</>
                    : pending
                      ? <><span className="spinner" /> Menunggu model siap…</>
                      : '🔍 Klasifikasikan'}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setImgUrl(null); setResult(null); setChainMsg(''); setPending(false); }}
                >
                  Ganti gambar
                </button>
              </div>
              {pending && (
                <p className="note">
                  Gambar siap. Begitu model selesai dimuat, prediksi langsung berjalan otomatis.
                </p>
              )}
              {result && <ResultPanel result={result} info={info} />}
            </div>
          </div>
        )}
      </div>

      {/* Aksi blockchain */}
      {result && result.status !== 'ood' && (
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>⛓️ Catat ke Blockchain (Polygon Amoy)</h3>
          <p className="note">
            Simpan hasil diagnosis secara permanen & terverifikasi di smart contract.
          </p>
          {!contractReady ? (
            <div className="alert alert-info" style={{ marginTop: 12 }}>
              Smart contract belum di-deploy. Fitur ini aktif setelah Tahap 7
              (deploy kontrak di Remix → isi <code>CONTRACT_ADDRESS</code>).
            </div>
          ) : !account ? (
            <div className="alert alert-warn" style={{ marginTop: 12 }}>
              Hubungkan wallet MetaMask dulu (tombol di pojok kanan atas).
            </div>
          ) : (
            <div className="row">
              <button className="btn btn-purple" onClick={handleSaveChain}>
                💾 Simpan ke blockchain
              </button>
            </div>
          )}
          {chainMsg && (
            <div className={`alert ${chainMsg.startsWith('✅') ? 'alert-info' : 'alert-warn'}`}
                 style={{ marginTop: 12, wordBreak: 'break-all' }}>
              {chainMsg}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ResultPanel({ result, info }) {
  const pct = (result.top.prob * 100).toFixed(2);

  if (result.status === 'ood') {
    return (
      <div className="alert alert-err" style={{ marginTop: 16 }}>
        ❌ <b>Gambar tidak dikenali.</b> Confidence terlalu rendah ({pct}%).
        Pastikan foto adalah <b>daun tebu</b> yang jelas, bukan objek lain.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div className="result-head">
        <span className="dot" style={{ background: info.color }} />
        <div>
          <div className="result-label" style={{ color: info.color }}>{info.label}</div>
          <div className="result-en">{result.top.name}</div>
        </div>
      </div>
      <div className="result-desc">{info.desc}</div>
      <div className="conf">
        Keyakinan: <b style={{ color: info.color }}>{pct}%</b>{' '}
        {result.status === 'low'
          ? <span className="badge badge-low">⚠️ Confidence rendah</span>
          : <span className="badge badge-ok">✓ Yakin</span>}
      </div>

      <div className="bars">
        {result.all.map((c) => {
          const ci = CLASS_INFO[c.name];
          return (
            <div className="bar-row" key={c.name}>
              <span className="bar-name">{ci.label}</span>
              <span className="bar-track">
                <span className="bar-fill"
                      style={{ width: `${c.prob * 100}%`, background: ci.color }} />
              </span>
              <span className="bar-val">{(c.prob * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
