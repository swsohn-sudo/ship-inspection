'use client';

import { useEffect, useState } from 'react';

// ── 인앱 브라우저 종류 ────────────────────────────────────────────────────────
type AppType = 'kakao' | 'line' | 'instagram' | 'facebook' | 'naver' | 'other-inapp';

function analyzeUA(ua: string): {
  isInApp:   boolean;
  appType:   AppType | null;
  isAndroid: boolean;
  isIOS:     boolean;
} {
  const isAndroid = /Android/i.test(ua);
  const isIOS     = /iPhone|iPad|iPod/i.test(ua);

  let appType: AppType | null = null;
  if      (/KAKAOTALK/i.test(ua))      appType = 'kakao';
  else if (/Line\//i.test(ua))         appType = 'line';
  else if (/Instagram/i.test(ua))      appType = 'instagram';
  else if (/FBAN|FBAV/i.test(ua))      appType = 'facebook';
  else if (/NAVER\(inapp/i.test(ua))   appType = 'naver';
  // 범용 Android WebView 감지 (wv 플래그)
  else if (/; wv\)/i.test(ua) && (isAndroid || isIOS)) appType = 'other-inapp';

  return { isInApp: appType !== null, appType, isAndroid, isIOS };
}

// ── 상태 정의 ─────────────────────────────────────────────────────────────────
// idle             : 인앱 브라우저 아님 → 렌더 없음
// android-redirect : Android intent:// 실행 중 → "Chrome으로 이동 중" 오버레이
// ios-attempting   : iOS 카카오 딥링크 시도 중 → "Safari로 이동 중" 오버레이
// fallback         : 자동 전환 불가 → 수동 안내 오버레이
type Phase = 'idle' | 'android-redirect' | 'ios-attempting' | 'fallback';

export default function InAppBrowserRedirect() {
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const ua = navigator.userAgent;
    const { isInApp, appType, isAndroid, isIOS } = analyzeUA(ua);

    if (!isInApp) return;

    const currentUrl = window.location.href;

    // ── Android: intent:// 스킴으로 크롬 강제 실행 ──────────────────────────
    if (isAndroid) {
      setPhase('android-redirect');

      const { host, pathname, search, protocol } = new URL(currentUrl);
      const scheme = protocol.replace(':', ''); // 'https'

      // Chrome 없으면 fallback_url(현재 URL)을 기본 브라우저로 열도록 지정
      const intentUrl =
        `intent://${host}${pathname}${search}` +
        `#Intent;scheme=${scheme};` +
        `package=com.android.chrome;` +
        `S.browser_fallback_url=${encodeURIComponent(currentUrl)};end;`;

      // 오버레이가 그려진 뒤 즉시 실행 (100ms 여유)
      const t = setTimeout(() => { window.location.replace(intentUrl); }, 100);
      return () => clearTimeout(t);
    }

    // ── iOS ──────────────────────────────────────────────────────────────────
    if (isIOS) {
      if (appType === 'kakao') {
        // 카카오톡 딥링크: 외부 브라우저로 현재 URL 열기
        setPhase('ios-attempting');
        const deepLink = `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
        window.location.replace(deepLink);

        // 1.5초 후에도 페이지가 살아있으면 딥링크 실패 → 폴백 안내
        const t = setTimeout(() => setPhase('fallback'), 1500);
        return () => clearTimeout(t);
      }

      // Line, Instagram, Facebook 등 iOS 기타 인앱 브라우저 → 즉시 폴백
      setPhase('fallback');
    }
  }, []);

  // ── idle: 인앱 브라우저 아님 ──────────────────────────────────────────────
  if (phase === 'idle') return null;

  // ── Android: 전환 중 오버레이 ─────────────────────────────────────────────
  if (phase === 'android-redirect') {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 px-8"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <svg className="animate-spin h-10 w-10 text-white/50" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <div className="text-center space-y-2">
          <p className="text-white font-bold text-base">Chrome으로 이동 중…</p>
          <p className="text-blue-200 text-sm">Opening in Chrome browser</p>
        </div>
        <p className="text-blue-300/70 text-xs text-center mt-2 leading-relaxed">
          자동으로 열리지 않으면 상단/하단 메뉴에서<br />
          <strong className="text-blue-200">&apos;다른 앱으로 열기&apos;</strong>를 선택하세요.
        </p>
      </div>
    );
  }

  // ── iOS KakaoTalk: 딥링크 시도 중 오버레이 ───────────────────────────────
  if (phase === 'ios-attempting') {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 px-8"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <svg className="animate-spin h-10 w-10 text-white/50" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <div className="text-center space-y-2">
          <p className="text-white font-bold text-base">Safari로 이동 중…</p>
          <p className="text-blue-200 text-sm">Opening in external browser</p>
        </div>
      </div>
    );
  }

  // ── 폴백: 수동 안내 오버레이 (iOS Line·Instagram 등 자동 전환 불가) ──────
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-7 px-6"
      style={{ backgroundColor: '#1e3a5f' }}
    >
      {/* 경고 아이콘 */}
      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
        <svg className="w-9 h-9 text-amber-300" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>

      {/* 안내 텍스트 */}
      <div className="text-center space-y-3 max-w-xs">
        <p className="text-white font-bold text-xl leading-snug">
          외부 브라우저로 열어주세요
        </p>
        <div className="bg-white/10 rounded-2xl px-5 py-4 text-left space-y-1.5 text-sm text-blue-100 leading-relaxed">
          <p>안전한 구글 로그인을 위해</p>
          <p>
            화면 <strong className="text-white">오른쪽 아래</strong> 또는{' '}
            <strong className="text-white">오른쪽 위</strong>의
          </p>
          <p className="text-white font-bold text-base py-0.5">
            [⋮] 또는 [···] 버튼
          </p>
          <p>을 누른 후,</p>
          <p className="text-white font-semibold">
            &apos;Safari로 열기&apos; 또는 &apos;기본 브라우저로 열기&apos;
          </p>
          <p>를 선택해 주세요.</p>
        </div>
      </div>

      {/* 아래 화살표 (카카오 등은 하단 메뉴 버튼) */}
      <div className="flex flex-col items-center gap-1 text-blue-300/80">
        <p className="text-xs">화면 하단 메뉴 버튼을 찾아주세요</p>
        <svg
          className="w-5 h-5 animate-bounce"
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
