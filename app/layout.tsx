import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cartographer — D&D Map Creator',
  description:
    'Webová D&D mapovací aplikace: Dungeon Mode (vektory) + World Mode (landmass masking). Bez loginu, bez cloudu, zdarma.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0b0d12',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
