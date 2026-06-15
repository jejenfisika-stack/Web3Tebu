// ============================================================
// Konfigurasi global TebuScan Web3
// ============================================================

// --- Model (Hugging Face) ---
export const MODEL_BASE =
  'https://huggingface.co/jejenFis06/scsmv-nasnetmobile/resolve/main';
export const MODEL_URL = `${MODEL_BASE}/model.json`;
export const CLASS_CONFIG_URL = `${MODEL_BASE}/class_config.json`;

// Fallback (sinkron dengan class_config.json di Hugging Face)
export const CLASS_NAMES = [
  'BacterialBlights', 'Healthy', 'Mosaic', 'RedRot', 'Rust', 'Yellow',
];

// Label bahasa Indonesia + warna + deskripsi singkat
export const CLASS_INFO = {
  BacterialBlights: { label: 'Hawar Bakteri', color: '#534AB7',
    desc: 'Infeksi bakteri — garis kuning-cokelat memanjang pada daun.' },
  Healthy:          { label: 'Sehat',          color: '#0F6E56',
    desc: 'Daun sehat, tidak ada gejala penyakit.' },
  Mosaic:           { label: 'Mosaik',         color: '#993C1D',
    desc: 'Virus mosaik — pola belang hijau muda & tua.' },
  RedRot:           { label: 'Busuk Merah',    color: '#A32D2D',
    desc: 'Jamur — jaringan dalam batang/daun memerah & membusuk.' },
  Rust:             { label: 'Karat',          color: '#854F0B',
    desc: 'Jamur karat — bintik oranye-cokelat di permukaan daun.' },
  Yellow:           { label: 'Daun Menguning', color: '#3B6D11',
    desc: 'Penyakit menguning — daun memucat dari ujung/tepi.' },
};

export const IMG_SIZE = 224;
export const OOD_THRESHOLD = 0.40;   // < ini → ditolak (bukan daun tebu / tak dikenali)
export const WARN_THRESHOLD = 0.55;  // < ini → confidence rendah

// --- Web3: Polygon Amoy Testnet ---
export const AMOY = {
  chainIdHex: '0x13882',            // 80002
  chainId: 80002,
  chainName: 'Polygon Amoy Testnet',
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
};

// --- Smart contract (diisi setelah deploy di Remix — Tahap 7) ---
export const CONTRACT_ADDRESS = ''; // TODO: alamat kontrak hasil deploy
export const CONTRACT_ABI = [
  // TODO: ABI hasil compile di Remix.
  // Contoh fungsi yang akan dipakai:
  // "function saveDiagnosis(string label, uint256 confidence, string ipfsCid) public",
  // "event DiagnosisSaved(address indexed user, string label, uint256 confidence, string ipfsCid, uint256 timestamp)"
];
