'use client';

import { ethers } from 'ethers';
import { AMOY, CONTRACT_ADDRESS, CONTRACT_ABI } from './config';

export function hasMetaMask() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

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

export async function ensureAmoy() {
  const current = await window.ethereum.request({ method: 'eth_chainId' });
  if (current === AMOY.chainIdHex) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AMOY.chainIdHex }],
    });
  } catch (err) {
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
    } else throw err;
  }
}

export function shortAddr(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Kompres gambar (maks 1280px, JPEG) agar upload ringan & di bawah batas serverless
function compressImage(file, maxDim = 1280, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const r = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * r);
        height = Math.round(height * r);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

// Sidik jari SHA-256 (bytes32) dari isi blob
async function sha256Bytes32(blob) {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return '0x' + hex;
}

// Alur lengkap: kompres → hash → upload IPFS → mint NFT sertifikat.
// onStep(msg) untuk update progres di UI.
export async function issueCertificate({ file, result, farmer, location, onStep }) {
  if (!CONTRACT_ADDRESS) throw new Error('Smart contract belum dikonfigurasi.');
  await ensureAmoy();

  onStep && onStep('Memproses gambar…');
  const blob = await compressImage(file);
  const photoHash = await sha256Bytes32(blob);

  // Cek anti-duplikat di kontrak
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  if (await contract.isPhotoCertified(photoHash)) {
    throw new Error('Foto ini sudah pernah disertifikasi sebelumnya.');
  }

  onStep && onStep('Mengunggah ke IPFS (Pinata)…');
  const fd = new FormData();
  fd.append('file', blob, 'tebu.jpg');
  fd.append('meta', JSON.stringify({
    label: result.top.name,
    pathogen: result.top.name,
    confidence: result.top.prob,
    farmer, location,
  }));
  const ipfsRes = await fetch('/api/pinata', { method: 'POST', body: fd });
  if (!ipfsRes.ok) {
    const e = await ipfsRes.json().catch(() => ({}));
    throw new Error(e.error || 'Gagal upload ke IPFS.');
  }
  const { imageCid, metadataCid } = await ipfsRes.json();

  onStep && onStep('Menerbitkan sertifikat di blockchain… (konfirmasi di MetaMask)');
  const confInt = Math.round(result.top.prob * 10000); // 93.17% → 9317
  const tx = await contract.mintDiagnosis(
    result.top.name, confInt, farmer || '-', location || '-',
    imageCid, photoHash, `ipfs://${metadataCid}`
  );
  const receipt = await tx.wait();

  // Ambil tokenId dari event DiagnosisMinted
  let tokenId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === 'DiagnosisMinted') {
        tokenId = parsed.args.tokenId.toString();
        break;
      }
    } catch { /* skip */ }
  }

  return { txHash: receipt.hash, tokenId, imageCid, metadataCid };
}
