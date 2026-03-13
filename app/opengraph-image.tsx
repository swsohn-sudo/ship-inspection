// ─────────────────────────────────────────────────────────────────────────────
// Open Graph 이미지 (1200×630 px)
// ─────────────────────────────────────────────────────────────────────────────
// Next.js App Router 파일 규약: app/opengraph-image.tsx 를 두면
//   · /opengraph-image 경로로 이미지를 자동 서빙
//   · layout.tsx metadata 에 og:image 메타 태그를 자동 삽입
//   · Vercel Edge Runtime 위에서 즉시 렌더링 (별도 패키지 불필요)
// ─────────────────────────────────────────────────────────────────────────────
import { ImageResponse } from 'next/og';

export const runtime     = 'edge';
export const alt         = 'SQT Official Document Reply App';
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
          background:     'linear-gradient(160deg, #091e38 0%, #1e3a5f 55%, #1a4a7a 100%)',
          fontFamily:     '"Helvetica Neue", Arial, sans-serif',
          overflow:       'hidden',
        }}
      >
        {/* ── 배경 장식 원 ──────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-120px', left: '-60px',
          width: '320px', height: '320px',
          borderRadius: '50%',
          background: 'rgba(16,185,129,0.06)',
          display: 'flex',
        }} />

        {/* ── 펼쳐진 책 아이콘 ──────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '48px' }}>

          {/* 왼쪽 페이지 */}
          <div style={{
            width:           '136px',
            height:          '176px',
            background:      'rgba(255,255,255,0.97)',
            borderRadius:    '8px 0 0 8px',
            padding:         '24px 20px',
            display:         'flex',
            flexDirection:   'column',
            gap:             '11px',
            boxShadow:       '-8px 8px 32px rgba(0,0,0,0.40)',
          }}>
            {/* 제목 선 (네이비) */}
            <div style={{ height: '8px', width: '72%', background: '#1e3a5f', borderRadius: '4px', display: 'flex' }} />
            {/* 본문 선들 (연회색) */}
            <div style={{ height: '6px', width: '92%', background: '#c0d4e8', borderRadius: '3px', display: 'flex' }} />
            <div style={{ height: '6px', width: '84%', background: '#c0d4e8', borderRadius: '3px', display: 'flex' }} />
            <div style={{ height: '6px', width: '52%', background: '#c0d4e8', borderRadius: '3px', display: 'flex' }} />
            <div style={{ height: '6px', width: '88%', background: '#c0d4e8', borderRadius: '3px', display: 'flex' }} />
            <div style={{ height: '6px', width: '68%', background: '#c0d4e8', borderRadius: '3px', display: 'flex' }} />
          </div>

          {/* 책등 (스파인) */}
          <div style={{
            width:      '16px',
            height:     '176px',
            background: 'linear-gradient(to right, #071526, #2d5a8a)',
            boxShadow:  '0 8px 16px rgba(0,0,0,0.50)',
            display:    'flex',
          }} />

          {/* 오른쪽 페이지 */}
          <div style={{
            width:         '136px',
            height:        '176px',
            background:    'rgba(255,255,255,0.97)',
            borderRadius:  '0 8px 8px 0',
            padding:       '24px 20px',
            display:       'flex',
            flexDirection: 'column',
            gap:           '11px',
            boxShadow:     '8px 8px 32px rgba(0,0,0,0.40)',
          }}>
            <div style={{ height: '8px', width: '62%', background: '#1e3a5f', borderRadius: '4px', display: 'flex' }} />
            <div style={{ height: '6px', width: '90%', background: '#c0d4e8', borderRadius: '3px', display: 'flex' }} />
            <div style={{ height: '6px', width: '76%', background: '#c0d4e8', borderRadius: '3px', display: 'flex' }} />
            <div style={{ height: '6px', width: '94%', background: '#c0d4e8', borderRadius: '3px', display: 'flex' }} />
            <div style={{ height: '6px', width: '48%', background: '#c0d4e8', borderRadius: '3px', display: 'flex' }} />
            <div style={{ height: '6px', width: '80%', background: '#c0d4e8', borderRadius: '3px', display: 'flex' }} />
          </div>
        </div>

        {/* ── 메인 타이틀 ──────────────────────────────────────────────── */}
        <div style={{
          fontSize:      '58px',
          fontWeight:    '800',
          color:         '#ffffff',
          letterSpacing: '-1.5px',
          marginBottom:  '14px',
          textAlign:     'center',
          display:       'flex',
        }}>
          SQT Official Document
        </div>

        {/* ── 서브 태그라인 ────────────────────────────────────────────── */}
        <div style={{
          fontSize:       '22px',
          color:          'rgba(147,197,253,0.85)',
          letterSpacing:  '3.5px',
          textTransform:  'uppercase',
          textAlign:      'center',
          display:        'flex',
        }}>
          Ship Inspection · Reply App
        </div>

        {/* ── 하단 에메랄드/블루 그라디언트 바 ────────────────────────── */}
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
