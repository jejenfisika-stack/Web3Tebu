// ============================================================
// Konfigurasi global TebuScan Web3
// ============================================================

// --- Inferensi: API Hugging Face Space (server-side) ---
// Endpoint dua-langkah Gradio: POST → event_id, lalu GET hasil
export const SPACE_API =
  'https://jejenfis06-tebuscan-api.hf.space/gradio_api/call/predict';

export const CLASS_NAMES = [
  'BacterialBlights', 'Healthy', 'Mosaic', 'RedRot', 'Rust', 'Yellow',
];

// Info tampilan tiap kelas (nama asli + patogen + warna + deskripsi)
export const CLASS_INFO = {
  BacterialBlights: { label: 'BacterialBlights', color: '#6366f1',
    pathogen: 'Xanthomonas albilineans / Acidovorax avenae (bakteri)',
    desc: 'Hawar daun bakteri — garis kuning kecokelatan memanjang pada daun.' },
  Healthy: { label: 'Healthy', color: '#10b981',
    pathogen: '— (tidak ada patogen)',
    desc: 'Daun sehat, tidak ditemukan gejala penyakit.' },
  Mosaic: { label: 'Mosaic', color: '#f59e0b',
    pathogen: 'Sugarcane Mosaic Virus / SCMV (virus)',
    desc: 'Pola belang hijau muda dan tua pada permukaan daun.' },
  RedRot: { label: 'RedRot', color: '#ef4444',
    pathogen: 'Colletotrichum falcatum (jamur)',
    desc: 'Busuk merah — jaringan memerah & membusuk pada batang/daun.' },
  Rust: { label: 'Rust', color: '#d97706',
    pathogen: 'Puccinia melanocephala (jamur)',
    desc: 'Karat daun — bintik/pustula oranye kecokelatan di permukaan daun.' },
  Yellow: { label: 'Yellow', color: '#84cc16',
    pathogen: 'Sugarcane Yellow Leaf Virus / SCYLV (virus)',
    desc: 'Daun menguning — memucat dari ujung atau tepi daun.' },
};

// --- Web3: Polygon Amoy Testnet ---
export const AMOY = {
  chainIdHex: '0x13882',            // 80002
  chainId: 80002,
  chainName: 'Polygon Amoy Testnet',
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
};

// --- Smart contract: TebuDiagnosisCertificate (Polygon Amoy) ---
export const CONTRACT_ADDRESS = '0x5622A54103d0Fa3503Ca593C2949cF397A11919E';
export const CONTRACT_ABI = [
  'function mintDiagnosis(string label, uint256 confidence, string farmer, string location, string ipfsCid, bytes32 photoHash, string metadataURI) returns (uint256)',
  'function isPhotoCertified(bytes32 photoHash) view returns (bool)',
  'function totalMinted() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'event DiagnosisMinted(uint256 indexed tokenId, address indexed owner, string label, uint256 confidence, string ipfsCid)',
];

// Gateway IPFS untuk menampilkan file (boleh ganti ke gateway Pinata Anda)
export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
