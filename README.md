# 🌿 TebuScan — Klasifikasi Penyakit Tebu (AI + Web3)

Deteksi 6 penyakit daun tebu (SCSMV) langsung di browser dengan model NASNetMobile
(TensorFlow.js), lalu catat hasilnya ke blockchain Polygon Amoy.

## Stack
- **Frontend**: Next.js 15 (App Router) + React 19
- **AI**: TensorFlow.js — model dari Hugging Face (`tf.loadLayersModel`)
- **Web3**: ethers v6 + MetaMask + Polygon Amoy Testnet

## Kelas
`BacterialBlights`, `Healthy`, `Mosaic`, `RedRot`, `Rust`, `Yellow`

## Menjalankan lokal
```bash
npm install
npm run dev
```
Buka http://localhost:3000

## Konfigurasi
Semua di `lib/config.js`:
- `MODEL_BASE` — URL model di Hugging Face
- `OOD_THRESHOLD` / `WARN_THRESHOLD` — ambang confidence
- `AMOY` — parameter jaringan Polygon Amoy
- `CONTRACT_ADDRESS` / `CONTRACT_ABI` — **diisi setelah deploy smart contract di Remix**

## Catatan model
Model = **LayersModel** (`model.json` + `group*.bin`).
Preprocessing: NASNetMobile → `(pixel/127.5)-1.0`, input 224×224.

## Deploy
Optimal di **Vercel** (push ke GitHub → import project → deploy).
