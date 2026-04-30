import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
};

export const metadata: Metadata = {
  title: 'MIT BUS',
  description: 'Live bus tracking system for MIT University Shillong',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
