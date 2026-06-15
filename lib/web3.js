'use client';

import { ethers } from 'ethers';
import { AMOY, CONTRACT_ADDRESS, CONTRACT_ABI } from './config';

export function hasMetaMask() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

// Hubungkan wallet + pastikan jaringan Polygon Amoy
export async function connectWallet() {
  if (!hasMetaMask()) {
    throw new Error('MetaMask tidak terdeteksi. Install dulu di metamask.io');
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  await ensureAmoy();
  return accounts[0];
}

export async function getAccount() {
  if (!hasMetaMask()) return null;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts[0] || null;
}

// Pastikan MetaMask aktif di jaringan Amoy (tambah jika belum ada)
export async function ensureAmoy() {
  const current = await window.ethereum.request({ method: 'eth_chainId' });
  if (current === AMOY.chainIdHex) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AMOY.chainIdHex }],
    });
  } catch (err) {
    // 4902 = jaringan belum ada di MetaMask → tambahkan
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: AMOY.chainIdHex,
          chainName: AMOY.chainName,
          rpcUrls: AMOY.rpcUrls,
          nativeCurrency: AMOY.nativeCurrency,
          blockExplorerUrls: AMOY.blockExplorerUrls,
        }],
      });
    } else {
      throw err;
    }
  }
}

// Simpan hasil diagnosis ke smart contract (aktif setelah CONTRACT_ADDRESS diisi)
export async function saveDiagnosis({ label, confidence, ipfsCid = '' }) {
  if (!CONTRACT_ADDRESS || CONTRACT_ABI.length === 0) {
    throw new Error('Smart contract belum di-deploy. Isi CONTRACT_ADDRESS & ABI di lib/config.js (Tahap 7).');
  }
  await ensureAmoy();
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  // confidence disimpan sebagai integer basis 10000 (mis. 93.17% → 9317)
  const confInt = Math.round(confidence * 10000);
  const tx = await contract.saveDiagnosis(label, confInt, ipfsCid);
  const receipt = await tx.wait();
  return receipt.hash;
}

export function shortAddr(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
