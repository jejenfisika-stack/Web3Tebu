'use client';

import { useRef, useState } from 'react';
import { classify } from '@/lib/model';
import { CLASS_INFO, CONTRACT_ADDRESS, AMOY, IPFS_GATEWAY } from '@/lib/config';
import { issueCertificate } from '@/lib/web3';

export default function Classifier({ account, onCertified }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [farmer, setFarmer] = useState('');
  const [location, setLocation] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);

  // Blockchain state
  const [chainBusy, setChainBusy] = useState(false);
  const [chainStep, setChainStep] = useState('');
  const [chainErr, setChainErr] = useState('');
  const [cert, setCert] = useState(null);
  const fileRef = useRef(null);

  function pickFile(f) {
    if (!f || !f.type.startsWith('image/')) return;
    setResult(null); setErr(''); setCert(null); setChainErr('');
    setFile(f);
    setImgUrl(URL.createObjectURL(f));
  }

  async function handlePredict() {
    if (!file) return;
    setBusy(true); setResult(null); setErr(''); setCert(null);
    try {
      setResult(await classify(file));
    } catch (e) {
      setErr(e.message || 'Gagal memprediksi.');
    } finally {
      setBusy(false);
    }
  }

  async function handleIssue() {
    if (!result || result.status === 'ood') return;
    setChainErr(''); setCert(null); setChainBusy(true);
    try {
      const c = await issueCertificate({
        file, result, farmer, location,
        onStep: (m) => setChainStep(m),
      });
      setCert(c);
      onCertified && onCertified(c);
    } catch (e) {
      setChainErr(e.message || 'Gagal menerbitkan sertifikat.');
    } finally {
      setChainBusy(false); setChainStep('');
    }
  }

  const info = result ? CLASS_INFO[result.top.name] : null;
  const contractReady = CONTRACT_ADDRESS && CONTRACT_ADDRESS.length > 0;
  const explorer = AMOY.blockExplorerUrls[0];

  return (
    <div className="card">
      {/* Dropzone */}
      <div
        className={`drop ${drag ? 'drag' : ''}`}
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

      <div className="field">
        <label>Nama Petani</label>
        <input value={farmer} onChange={(e) => setFarmer(e.target.value)} placeholder="mis. Pak Suka" />
      </div>
      <div className="field">
        <label>Lokasi Kebun</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="mis. Bondowoso, Jawa Timur" />
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
                onClick={() => { setImgUrl(null); setFile(null); setResult(null); setErr(''); setCert(null); setChainErr(''); }}>
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
          <p className="note">Foto disimpan di IPFS, hasil diagnosis dicetak jadi NFT permanen di Polygon Amoy.</p>

          {!contractReady ? (
            <div className="alert alert-info">Smart contract belum dikonfigurasi.</div>
          ) : !account ? (
            <div className="alert alert-warn">Hubungkan wallet MetaMask dulu (tombol di pojok kanan atas).</div>
          ) : cert ? (
            <div className="alert alert-info">
              ✅ <b>Sertifikat #{cert.tokenId} berhasil diterbitkan!</b><br />
              🔗 <a href={`${explorer}/tx/${cert.txHash}`} target="_blank" rel="noreferrer">Lihat transaksi di PolygonScan</a><br />
              🖼️ <a href={`${IPFS_GATEWAY}${cert.imageCid}`} target="_blank" rel="noreferrer">Foto di IPFS</a>{' · '}
              <a href={`${IPFS_GATEWAY}${cert.metadataCid}`} target="_blank" rel="noreferrer">Metadata</a>
            </div>
          ) : (
            <>
              <div className="row">
                <button className="btn btn-purple" onClick={handleIssue} disabled={chainBusy}>
                  {chainBusy ? <><span className="spinner" /> Memproses…</> : '💾 Terbitkan sertifikat'}
                </button>
              </div>
              {chainBusy && chainStep && <div className="alert alert-info">⏳ {chainStep}</div>}
              {chainErr && <div className="alert alert-err">⚠️ {chainErr}</div>}
            </>
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
