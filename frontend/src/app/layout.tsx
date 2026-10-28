import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '../components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Azatech - Order Management System',
  description: 'Sistem Online Shop dan Manajemen Pesanan - PT Laksmada Aza Simetri',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-emerald-500 selection:text-white">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
