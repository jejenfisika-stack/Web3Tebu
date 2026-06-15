'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import WalletConnect from '@/components/WalletConnect';

// TF.js hanya jalan di browser → matikan SSR untuk Classifier
const Classifier = dynamic(() => import('@/components/Classifier'), { ssr: false });

export default function Home() {
  const [account, setAccount] = useState(null);

  return (
    <main className="container">
      <header className="topbar">
        <div className="brand">
          <div className="logo">🌿</div>
          <div>
            <h1>TebuScan</h1>
            <p>Deteksi 6 penyakit daun tebu · AI + Blockchain</p>
          </div>
        </div>
        <WalletConnect onChange={setAccount} />
      </header>

      <Classifier account={account} />

      <p className="footer">
        Model: NASNetMobile (TF.js) di Hugging Face · Jaringan: Polygon Amoy Testnet ·
        Inferensi 100% di browser Anda
      </p>
    </main>
  );
}
