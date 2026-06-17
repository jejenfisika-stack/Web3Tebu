import { NextResponse } from 'next/server';

// Upload foto + metadata ke IPFS via Pinata. JWT disimpan di env var (server-side).
export async function POST(request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: 'PINATA_JWT belum diset di environment variable.' },
      { status: 500 }
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 });
  }

  const file = form.get('file');
  const meta = JSON.parse(form.get('meta') || '{}');
  if (!file) {
    return NextResponse.json({ error: 'Tidak ada file gambar.' }, { status: 400 });
  }

  // 1) Pin gambar ke IPFS
  const imgForm = new FormData();
  imgForm.append('file', file, 'tebu-leaf.jpg');
  imgForm.append('pinataMetadata', JSON.stringify({ name: `tebu-${Date.now()}.jpg` }));

  const imgRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: imgForm,
  });
  if (!imgRes.ok) {
    return NextResponse.json(
      { error: 'Gagal upload gambar ke IPFS: ' + (await imgRes.text()).slice(0, 200) },
      { status: 502 }
    );
  }
  const imageCid = (await imgRes.json()).IpfsHash;

  // 2) Susun metadata NFT lalu pin ke IPFS
  const confPct = ((meta.confidence ?? 0) * 100).toFixed(2);
  const metadata = {
    name: `Sertifikat Diagnosis Tebu — ${meta.label}`,
    description:
      `Sertifikat diagnosis penyakit daun tebu. Hasil: ${meta.label} ` +
      `(keyakinan ${confPct}%). Petani: ${meta.farmer || '-'}. ` +
      `Lokasi: ${meta.location || '-'}. Model: NASNetMobile (Tebu Web3, Universitas Jember).`,
    image: `ipfs://${imageCid}`,
    attributes: [
      { trait_type: 'Penyakit', value: meta.label || '-' },
      { trait_type: 'Patogen', value: meta.pathogen || '-' },
      { trait_type: 'Keyakinan', value: `${confPct}%` },
      { trait_type: 'Petani', value: meta.farmer || '-' },
      { trait_type: 'Lokasi', value: meta.location || '-' },
      { trait_type: 'Model', value: 'NASNetMobile' },
      { trait_type: 'Jaringan', value: 'Polygon Amoy' },
    ],
  };

  const jsonRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `tebu-meta-${Date.now()}.json` },
    }),
  });
  if (!jsonRes.ok) {
    return NextResponse.json(
      { error: 'Gagal upload metadata ke IPFS: ' + (await jsonRes.text()).slice(0, 200) },
      { status: 502 }
    );
  }
  const metadataCid = (await jsonRes.json()).IpfsHash;

  return NextResponse.json({ imageCid, metadataCid });
}
