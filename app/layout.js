import './globals.css';

export const metadata = {
  title: 'Tebu Web3 — Klasifikasi Penyakit Tebu (AI + Blockchain)',
  description:
    'Deteksi 6 penyakit daun tebu dengan AI (NASNetMobile) terverifikasi blockchain Polygon. Riset Universitas Jember.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
