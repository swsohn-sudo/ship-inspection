import type { Metadata, Viewport } from 'next';
import RegisterSW            from './components/RegisterSW';
import Providers              from './providers';
import InAppBrowserRedirect   from './components/InAppBrowserRedirect';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),

  title:       'Ship Safety Inspection',
  description: 'Container ship safety inspection checklist & deficiency report',
  manifest:    '/manifest.json',

  openGraph: {
    type:        'website',
    title:       'Ship Safety Inspection',
    description: 'Container ship safety inspection checklist & deficiency report',
  },

  twitter: {
    card:        'summary_large_image',
    title:       'Ship Safety Inspection',
    description: 'Container ship safety inspection checklist & deficiency report',
  },

  appleWebApp: {
    capable:         true,
    statusBarStyle:  'black-translucent',
    title:           'Ship Inspection',
  },
  icons: {
    apple: '/icons/icon-192.svg',
    icon:  '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e3a5f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <Providers>
          <InAppBrowserRedirect />
          {children}
          <RegisterSW />
        </Providers>
      </body>
    </html>
  );
}