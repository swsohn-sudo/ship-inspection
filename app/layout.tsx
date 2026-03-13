import type { Metadata, Viewport } from 'next';
import RegisterSW            from './components/RegisterSW';
import Providers              from './providers';
import InAppBrowserRedirect   from './components/InAppBrowserRedirect';
import './globals.css';

export const metadata: Metadata = {
  // metadataBase: OG 이미지 등 상대 경로를 절대 URL 로 변환하는 기준
  // NEXTAUTH_URL 에 배포 도메인이 설정되어 있으면 그 값을 사용,
  // 없으면 localhost 로 폴백 (로컬 개발 시)
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),

  title:       'SQT Official Document Reply App',
  description: 'Ship inspection photo upload & automated report generation',
  manifest:    '/manifest.json',

  // ── Open Graph (카카오, 라인, 슬랙 등 링크 미리보기) ──────────────────
  openGraph: {
    type:        'website',
    title:       'SQT Official Document Reply App',
    description: 'Ship inspection photo upload & automated report generation',
    // og:image 는 app/opengraph-image.tsx 가 자동 생성 및 삽입
  },

  // ── Twitter / X 카드 ─────────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    title:       'SQT Official Document Reply App',
    description: 'Ship inspection photo upload & automated report generation',
  },

  appleWebApp: {
    capable:         true,
    statusBarStyle:  'black-translucent',
    title:           'SQT Inspection',
  },
  icons: {
    apple: '/icons/icon-192.svg',
    icon:  '/icons/icon-512.svg',
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
        {/* iOS 홈 화면 추가 전체화면 지원 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <Providers>
          {/* 인앱 브라우저 감지 → 자동 외부 브라우저 전환 (가장 먼저 마운트) */}
          <InAppBrowserRedirect />
          {children}
          <RegisterSW />
        </Providers>
      </body>
    </html>
  );
}
