'use client';

import { useEffect, useState } from 'react';
import { connectWallet, getAccount, hasMetaMask, shortAddr } from '@/lib/web3';

export default function WalletConnect({ onChange }) {
  const [account, setAccount] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    getAccount().then((a) => {
      if (a) { setAccount(a); onChange && onChange(a); }
    });
    if (hasMetaMask()) {
      const handler = (accs) => {
        const a = accs[0] || null;
        setAccount(a);
        onChange && onChange(a);
      };
      window.ethereum.on('accountsChanged', handler);
      return () => window.ethereum.removeListener('accountsChanged', handler);
    }
  }, [onChange]);

  async function handleConnect() {
    setErr('');
    try {
      const a = await connectWallet();
      setAccount(a);
      onChange && onChange(a);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="wallet">
      {account ? (
        <span className="pill connected" title={account}>
          🟢 {shortAddr(account)}
        </span>
      ) : (
        <button className="btn btn-purple" onClick={handleConnect}>
          🦊 Hubungkan Wallet
        </button>
      )}
      {err && <span className="pill" style={{ color: '#f87171' }}>{err}</span>}
    </div>
  );
}
