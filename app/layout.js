import './globals.css';

export const metadata = {
  title: 'TebuScan — Klasifikasi Penyakit Tebu (AI + Web3)',
  description:
    'Deteksi 6 penyakit daun tebu dengan AI (NASNetMobile) langsung di browser, terverifikasi blockchain Polygon.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
