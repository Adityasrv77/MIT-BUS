import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import '../styles/globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#F69423',
};

export const metadata: Metadata = {
  title: 'MIT BUS',
  description: 'Live bus tracking system for MIT University Shillong',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MIT Bus',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
};

import { ErrorBoundary } from '../components/ErrorBoundary';
import PushManager from '../components/PushManager';
import GlobalClientInit from '../components/GlobalClientInit';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning className={montserrat.className}>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <GlobalClientInit />
          <PushManager />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

