'use client';

import { SPACE_API } from './config';

// Ubah File/Blob gambar → data URL base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // "data:image/...;base64,XXXX"
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Klasifikasi via API Hugging Face Space (server-side inferensi).
// Mengembalikan { top, all, status, threshold }.
export async function classify(file) {
  const b64 = await fileToBase64(file);

  // Langkah 1: POST → dapat event_id
  const post = await fetch(SPACE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [b64] }),
  });
  if (!post.ok) {
    throw new Error('Gagal menghubungi server AI. Coba lagi sebentar.');
  }
  const { event_id } = await post.json();
  if (!event_id) throw new Error('Server tidak merespons dengan benar.');

  // Langkah 2: GET hasil (event-stream Gradio)
  const res = await fetch(`${SPACE_API}/${event_id}`);
  const text = await res.text();

  // Cari baris "data: [...]" pada event-stream
  const dataLine = text
    .split('\n')
    .reverse()
    .find((l) => l.startsWith('data:'));
  if (!dataLine) throw new Error('Respons server tidak valid.');

  const payload = JSON.parse(dataLine.slice(5).trim()); // ["{json}"]
  const result = JSON.parse(payload[0]);
  if (result.error) {
    throw new Error('Server: ' + result.error);
  }
  return result; // { top:{name,prob}, all:[{name,prob}], status, threshold }
}
