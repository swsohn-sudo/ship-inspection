import { ImageResponse } from 'next/og';

export const runtime     = 'edge';
export const alt         = 'Ship Safety Inspection';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position:       'relative',
          width:          '1200px',
          height:         '630px',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          background:     'linear-gradient(160deg, #091e38 0%, #0a3055 55%, #0d4a7a 100%)',
          fontFamily:     '"Helvetica Neue", Arial, sans-serif',
          overflow:       'hidden',
        }}
      >
        {/* ── 바다 물결 배경 ── */}
        <div style={{
          position: 'absolute', bottom: '0', left: '0',
          width: '1200px', height: '160px',
          background: 'linear-gradient(to top, rgba(10,48,85,0.9), transparent)',
          display: 'flex',
        }} />

        {/* ── 컨테이너선 SVG ── */}
        <div style={{ display: 'flex', marginBottom: '44px' }}>
          <svg width="320" height="160" viewBox="0 0 320 160" fill="none">
            {/* 선체 */}
            <path d="M20 110 L40 90 L280 90 L300 110 L280 125 L40 125 Z"
              fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5"/>
            {/* 선수 */}
            <path d="M280 90 L310 110 L280 125" fill="rgba(255,255,255,0.1)"
              stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
            {/* 선교(브리지) */}
            <rect x="200" y="65" width="60" height="28" rx="3"
              fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.6)" strokeWidth="2"/>
            {/* 브리지 창문 */}
            <rect x="208" y="72" width="10" height="8" rx="1" fill="rgba(147,197,253,0.7)"/>
            <rect x="223" y="72" width="10" height="8" rx="1" fill="rgba(147,197,253,0.7)"/>
            <rect x="238" y="72" width="10" height="8" rx="1" fill="rgba(147,197,253,0.7)"/>
            {/* 굴뚝 */}
            <rect x="228" y="48" width="16" height="20" rx="2"
              fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            {/* 컨테이너 박스들 - 1열 */}
            <rect x="48"  y="68" width="36" height="24" rx="2" fill="rgba(16,185,129,0.55)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
            <rect x="90"  y="68" width="36" height="24" rx="2" fill="rgba(59,130,246,0.55)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
            <rect x="132" y="68" width="36" height="24" rx="2" fill="rgba(245,158,11,0.55)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
            <rect x="174" y="68" width="22" height="24" rx="2" fill="rgba(239,68,68,0.55)"  stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
            {/* 컨테이너 박스들 - 2열 */}
            <rect x="55"  y="46" width="36" height="24" rx="2" fill="rgba(59,130,246,0.45)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="97"  y="46" width="36" height="24" rx="2" fill="rgba(16,185,129,0.45)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="139" y="46" width="36" height="24" rx="2" fill="rgba(245,158,11,0.45)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            {/* 컨테이너 세로선 (디테일) */}
            <line x1="66"  y1="68" x2="66"  y2="92" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
            <line x1="102" y1="68" x2="102" y2="92" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
            <line x1="150" y1="68" x2="150" y2="92" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
            {/* 수면선 */}
            <path d="M15 128 Q80 122 160 128 Q240 134 310 128"
              stroke="rgba(147,197,253,0.5)" strokeWidth="2" fill="none"/>
            <path d="M10 136 Q80 130 160 136 Q240 142 315 136"
              stroke="rgba(147,197,253,0.3)" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>

        {/* ── 메인 타이틀 ── */}
        <div style={{
          fontSize:      '58px',
          fontWeight:    '800',
          color:         '#ffffff',
          letterSpacing: '-1.5px',
          marginBottom:  '14px',
          textAlign:     'center',
          display:       'flex',
        }}>
          Ship Safety Inspection
        </div>

        {/* ── 서브 태그라인 ── */}
        <div style={{
          fontSize:      '22px',
          color:         'rgba(147,197,253,0.85)',
          letterSpacing: '3.5px',
          textTransform: 'uppercase',
          textAlign:     'center',
          display:       'flex',
        }}>
          Container Ship · Safety Check
        </div>

        {/* ── 하단 그라디언트 바 ── */}
        <div style={{
          position:   'absolute',
          bottom:     '0',
          left:       '0',
          width:      '1200px',
          height:     '8px',
          background: 'linear-gradient(to right, #10b981, #3b82f6, #10b981)',
          display:    'flex',
        }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}