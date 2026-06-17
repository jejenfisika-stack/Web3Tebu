'use client';

import { useState } from 'react';
import WalletConnect from '@/components/WalletConnect';
import Classifier from '@/components/Classifier';
import { CLASS_NAMES, CLASS_INFO } from '@/lib/config';

const STEPS = [
  ['Unggah Foto', 'Foto daun tebu dari kamera HP atau galeri (JPG/PNG).'],
  ['Isi Data', 'Masukkan nama petani & lokasi kebun untuk sertifikat.'],
  ['Klasifikasi AI', 'Model NASNetMobile mengenali penyakit dalam hitungan detik.'],
  ['Konfirmasi Wallet', 'Setujui transaksi via MetaMask di jaringan Polygon Amoy.'],
  ['Sertifikat On-Chain', 'Dapatkan sertifikat diagnosis permanen di blockchain.'],
];

const TECH = [
  ['🧠', 'NASNetMobile', 'CNN transfer-learning, 5.3 juta parameter'],
  ['⛓️', 'Polygon Amoy', 'Blockchain testnet, standar ERC-721'],
  ['📦', 'Pinata IPFS', 'Penyimpanan gambar terdesentralisasi'],
  ['🦊', 'MetaMask', 'Dompet Web3 & tanda tangan transaksi'],
  ['🤗', 'Hugging Face', 'Inferensi AI server-side (API)'],
  ['▲', 'Vercel', 'Deployment edge global'],
];

const LAYERS = [
  ['Sidik Jari SHA-256', 'Setiap foto daun dikonversi menjadi fingerprint kriptografis 256-bit yang unik menggunakan algoritma SHA-256.'],
  ['Registry On-Chain', 'Blockchain mencegah pencatatan sertifikat ganda melalui mapping registry & penolakan di lapisan konsensus.'],
  ['Perceptual Hash', 'Membandingkan kemiripan visual dengan jarak Hamming ≤5 bit untuk menandai gambar yang nyaris identik.'],
  ['Sertifikat ERC-721', 'Sertifikat NFT immutable menyimpan jenis penyakit, confidence CNN, nama petani, lokasi, timestamp, dan hash foto.'],
  ['IPFS Content-Addressing', 'Penyimpanan terdesentralisasi via CID yang otomatis berubah bila file dimodifikasi.'],
  ['MetaMask ECDSA', 'Penandatanganan transaksi kriptografis; private key tetap di perangkat pengguna.'],
  ['Deteksi OOD (AI)', 'Validasi 3 lapis: tolak non-tebu, ambang confidence <40%, dan analisis distribusi probabilitas. Akurasi 93,17%.'],
];

export default function Home() {
  const [account, setAccount] = useState(null);
  const [cert, setCert] = useState(null);

  return (
    <main className="container">
      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <div className="logo">🌿</div>
          <div>
            <h1>Tebu Web3</h1>
            <p>Riset Unggulan · Universitas Jember</p>
          </div>
        </div>
        <WalletConnect onChange={setAccount} />
      </header>

      {/* Hero */}
      <section className="hero">
        <h2>Klasifikasi Penyakit Daun Tebu</h2>
        <p className="sub">
          6 penyakit daun tebu terverifikasi AI & tercatat di blockchain.
          Deteksi cepat, transparan, dan terdesentralisasi untuk pertanian tebu modern.
        </p>
        <div className="badges">
          <span className="badge2">🧠 NASNetMobile · 6-Class · 93.17%</span>
          <span className="badge2">⛓️ Polygon Amoy</span>
          <span className="badge2">📦 IPFS Pinata</span>
        </div>
        <div className="blocks">
          <div className="block"><b>HASH</b>{cert ? `${cert.txHash.slice(0, 6)}…${cert.txHash.slice(-4)}` : 'belum ada'}</div>
          <div className="block"><b>SERTIFIKAT</b>{cert ? `#${cert.tokenId}` : '—'}</div>
          <div className="block"><b>DIAGNOSIS</b>{cert ? 'Verified ✓' : 'menunggu'}</div>
        </div>
      </section>

      {/* Classifier (interaktif) */}
      <section className="section" id="cek">
        <div className="section-head"><span className="ic">🔬</span><h3>Cek Penyakit Tebu dengan AI</h3></div>
        <p className="section-sub">
          Unggah foto daun tebu — model akan mengklasifikasikan ke 6 kelas dan
          otomatis menolak gambar yang bukan daun tebu.
        </p>
        <Classifier account={account} onCertified={setCert} />
      </section>

      {/* 6 Penyakit */}
      <section className="section">
        <div className="section-head"><span className="ic">🍃</span><h3>6 Kelas yang Dikenali</h3></div>
        <p className="section-sub">
          Model dilatih mengenali 5 penyakit utama daun tebu plus kondisi sehat,
          lengkap dengan patogen penyebabnya.
        </p>
        <div className="grid">
          {CLASS_NAMES.map((name) => {
            const d = CLASS_INFO[name];
            return (
              <div className="disease" key={name} style={{ '--c': d.color }}>
                <div className="dh"><span className="dot" /><h4>{d.label}</h4></div>
                <div className="patho">Patogen: {d.pathogen}</div>
                <p>{d.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cara pakai */}
      <section className="section">
        <div className="section-head"><span className="ic">📋</span><h3>Cara Menggunakan</h3></div>
        <p className="section-sub">Lima langkah dari foto daun hingga sertifikat digital di blockchain.</p>
        <div className="steps">
          {STEPS.map(([t, p], i) => (
            <div className="step" key={i}>
              <div className="n">{i + 1}</div>
              <h5>{t}</h5>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Teknologi */}
      <section className="section">
        <div className="section-head"><span className="ic">🛠️</span><h3>Tumpukan Teknologi</h3></div>
        <p className="section-sub">Komponen inti yang menyusun sistem Tebu Web3.</p>
        <div className="tech">
          {TECH.map(([e, t, p], i) => (
            <div className="techc" key={i}>
              <span className="te">{e}</span>
              <div><h5>{t}</h5><p>{p}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Keamanan */}
      <section className="section">
        <div className="section-head"><span className="ic">🛡️</span><h3>Arsitektur Keamanan</h3></div>
        <p className="section-sub">
          Tujuh lapis pertahanan untuk menjamin keaslian foto, integritas data, dan
          validitas sertifikat diagnosis.
        </p>
        <div className="layers">
          {LAYERS.map(([t, p], i) => (
            <div className="layer" key={i}>
              <div className="lh"><span className="chk">✓</span><h5>{t}</h5></div>
              <p>{p}</p>
            </div>
          ))}
        </div>
        <div className="scorecard">
          <div>
            <div className="big">7/7 Lapis Aktif</div>
            <div style={{ opacity: .9, fontSize: 13 }}>Sistem pertahanan berlapis siap melindungi setiap diagnosis</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, opacity: .85 }}>Smart Contract (Polygon Amoy)</div>
            <a href="https://amoy.polygonscan.com/address/0x5622A54103d0Fa3503Ca593C2949cF397A11919E"
               target="_blank" rel="noreferrer"
               style={{ color: '#d1fae5', fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
              0x5622…919E ✓
            </a>
          </div>
        </div>
      </section>

      <p className="footer">
        🌿 <b>Tebu Web3</b> — Klasifikasi Penyakit Tebu berbasis AI & Blockchain ·
        Model NASNetMobile di Hugging Face Space (server-side) ·
        Jaringan Polygon Amoy Testnet · Universitas Jember
      </p>
    </main>
  );
}
