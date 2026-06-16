'use client';

import { useRef, useState } from 'react';
import { classify } from '@/lib/model';
import { CLASS_INFO, CONTRACT_ADDRESS } from '@/lib/config';
import { saveDiagnosis } from '@/lib/web3';

export default function Classifier({ account }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [farmer, setFarmer] = useState('');
  const [location, setLocation] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);
  const [chainMsg, setChainMsg] = useState('');
  const fileRef = useRef(null);

  function pickFile(f) {
    if (!f || !f.type.startsWith('image/')) return;
    setResult(null); setErr(''); setChainMsg('');
    setFile(f);
    setImgUrl(URL.createObjectURL(f));
  }

  async function handlePredict() {
    if (!file) return;
    setBusy(true); setResult(null); setErr('');
    try {
      setResult(await classify(file));
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Gagal memprediksi.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveChain() {
    if (!result || result.status === 'ood') return;
    setChainMsg('');
    try {
      const hash = await saveDiagnosis({
        label: result.top.name, confidence: result.top.prob,
        farmer, location,
      });
      setChainMsg(`✅ Tersimpan di blockchain. Tx: ${hash}`);
    } catch (e) {
      setChainMsg('⚠️ ' + e.message);
    }
  }

  const info = result ? CLASS_INFO[result.top.name] : null;
  const contractReady = CONTRACT_ADDRESS && CONTRACT_ADDRESS.length > 0;

  return (
    <div className="card">
      <div className="alert alert-info" style={{ marginTop: 0 }}>
        🛰️ Inferensi berjalan di server (Hugging Face) — hasil cepat, tanpa unduh model.
      </div>

      {/* Dropzone */}
      <div
        className={`drop ${drag ? 'drag' : ''}`}
        style={{ marginTop: 14 }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
      >
        <div className="icon">🌿📷</div>
        <p><strong>Klik</strong> atau seret foto daun tebu ke sini</p>
        <p>Dari kamera HP atau galeri · JPG, PNG</p>
        <input ref={fileRef} type="file" accept="image/*" hidden
               onChange={(e) => pickFile(e.target.files[0])} />
      </div>

      {/* Data petani */}
      <div className="field">
        <label>Nama Petani</label>
        <input value={farmer} onChange={(e) => setFarmer(e.target.value)}
               placeholder="mis. Pak Suka" />
      </div>
      <div className="field">
        <label>Lokasi Kebun</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)}
               placeholder="mis. Bondowoso, Jawa Timur" />
      </div>

      {imgUrl && (
        <div className="preview-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt="preview daun tebu" className="preview" />
          <div className="preview-col">
            <div className="row" style={{ marginTop: 0 }}>
              <button className="btn btn-primary" onClick={handlePredict} disabled={busy}>
                {busy ? <><span className="spinner" /> Menganalisis…</> : '🔍 Klasifikasikan'}
              </button>
              <button className="btn btn-ghost"
                onClick={() => { setImgUrl(null); setFile(null); setResult(null); setErr(''); setChainMsg(''); }}>
                Ganti gambar
              </button>
            </div>
            {err && <div className="alert alert-err">⚠️ {err}</div>}
            {result && <ResultPanel result={result} info={info} />}
          </div>
        </div>
      )}

      {/* Blockchain */}
      {result && result.status !== 'ood' && (
        <div style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 18 }}>
          <h4 style={{ marginBottom: 6 }}>⛓️ Terbitkan Sertifikat di Blockchain</h4>
          <p className="note">Simpan hasil diagnosis sebagai sertifikat permanen di Polygon Amoy.</p>
          {!contractReady ? (
            <div className="alert alert-info">
              Smart contract belum di-deploy. Fitur ini aktif setelah tahap deploy kontrak (Remix → Polygon Amoy).
            </div>
          ) : !account ? (
            <div className="alert alert-warn">Hubungkan wallet MetaMask dulu (tombol di pojok kanan atas).</div>
          ) : (
            <div className="row"><button className="btn btn-purple" onClick={handleSaveChain}>💾 Terbitkan sertifikat</button></div>
          )}
          {chainMsg && (
            <div className={`alert ${chainMsg.startsWith('✅') ? 'alert-info' : 'alert-warn'}`}
                 style={{ wordBreak: 'break-all' }}>{chainMsg}</div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultPanel({ result, info }) {
  const pct = (result.top.prob * 100).toFixed(2);
  if (result.status === 'ood') {
    return (
      <div className="alert alert-err" style={{ marginTop: 16 }}>
        ❌ <b>Gambar tidak dikenali.</b> Confidence tertinggi hanya {pct}%.
        Pastikan foto adalah <b>daun tebu</b> yang jelas, bukan objek lain.
      </div>
    );
  }
  return (
    <div style={{ marginTop: 16 }}>
      <div className="result-head">
        <span className="dot" style={{ background: info.color }} />
        <div>
          <div className="result-label" style={{ color: info.color }}>{info.label}</div>
          <div className="result-en">Patogen: <i>{info.pathogen}</i></div>
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
                <span className="bar-fill" style={{ width: `${c.prob * 100}%`, background: ci.color }} />
              </span>
              <span className="bar-val">{(c.prob * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
