'use client';

import type { InspectionItem } from '../../lib/inspectionData';

// ─────────────────────────────────────────────────────────────────────────────
// Off-screen PDF 보고서 HTML 템플릿
//
// · 고정 너비 720px — lib/generatePdf.ts의 TEMPLATE_W 상수와 반드시 동일
// · html2canvas가 DOM을 이미지로 캡처하므로 한글 깨짐 없음 (시스템 폰트 그대로 사용)
// · 각 [data-pdf-section] 요소가 PDF의 개별 캡처 단위
// · slot.preview는 URL.createObjectURL() blob URL — 같은 origin이므로 html2canvas가 읽을 수 있음
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  items:         InspectionItem[];
  vesselName:    string;
  inspectorName: string;
  reportTitle:   string;
}

// 스핀 컴포넌트 없이 정적 스타일만 사용 (html2canvas CSS 호환성 최대화)
const S = {
  // 공통 리셋
  root: {
    width:      '720px',
    fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
    background: '#ffffff',
    color:      '#1e293b',
    fontSize:   '14px',
    lineHeight: '1.5',
  } as React.CSSProperties,

  // ── 헤더 섹션 ────────────────────────────────────────────────────────────
  headerWrap: {
    padding: '0 0 12px 0',
  } as React.CSSProperties,

  headerTitle: {
    background:   '#1e3a5f',
    color:        '#ffffff',
    padding:      '20px 24px',
    borderRadius: '8px 8px 0 0',
    textAlign:    'center' as const,
  } as React.CSSProperties,

  headerTitleText: {
    margin:     0,
    fontSize:   '22px',
    fontWeight: 'bold',
  } as React.CSSProperties,

  headerInfo: {
    background:      '#d6e4f0',
    padding:         '10px 24px',
    borderRadius:    '0 0 8px 8px',
    display:         'flex',
    justifyContent:  'space-between',
    fontSize:        '13px',
    color:           '#1e3a5f',
    fontWeight:      '600',
  } as React.CSSProperties,

  // ── 항목 섹션 ────────────────────────────────────────────────────────────
  itemWrap: {
    marginBottom: '14px',
    borderRadius: '8px',
    overflow:     'hidden',
    border:       '1px solid #bfd7ed',
  } as React.CSSProperties,

  itemHeader: {
    background: '#1e3a5f',
    color:      '#ffffff',
    padding:    '10px 16px',
  } as React.CSSProperties,

  itemTitleKo: {
    fontSize:   '14px',
    fontWeight: 'bold',
    margin:     0,
  } as React.CSSProperties,

  itemTitleEn: {
    fontSize:   '11px',
    opacity:    0.8,
    marginTop:  '4px',
    fontStyle:  'italic',
  } as React.CSSProperties,

  // ── 사진 그리드 ──────────────────────────────────────────────────────────
  photoGrid: {
    display:               'grid',
    gridTemplateColumns:   '1fr 1fr',
    gap:                   '1px',
    background:            '#bfd7ed',
  } as React.CSSProperties,

  photoCell: {
    background:     '#ffffff',
    display:        'flex',
    flexDirection:  'column' as const,
  } as React.CSSProperties,

  slotLabel: {
    background:  '#2c4a6e',
    color:       '#ffffff',
    fontSize:    '11px',
    fontWeight:  'bold',
    padding:     '6px 10px',
    textAlign:   'center' as const,
  } as React.CSSProperties,

  photoBox: {
    height:          '200px',
    overflow:        'hidden',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    background:      '#f8faff',
  } as React.CSSProperties,

  photoImg: {
    width:      '100%',
    height:     '200px',
    objectFit:  'cover' as const,
    display:    'block',
  } as React.CSSProperties,

  photoEmpty: {
    height:          '200px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    background:      '#f1f5f9',
    color:           '#94a3b8',
    fontSize:        '12px',
  } as React.CSSProperties,

  // ── Remark ────────────────────────────────────────────────────────────────
  remark: {
    background:  '#fef9c3',
    padding:     '10px 16px',
    fontSize:    '11px',
    color:       '#78350f',
    fontStyle:   'italic',
    borderTop:   '1px solid #bfd7ed',
  } as React.CSSProperties,

  // ── 서명 ─────────────────────────────────────────────────────────────────
  signature: {
    padding:    '12px 0 8px',
    textAlign:  'right' as const,
    fontSize:   '11px',
    color:      '#64748b',
    fontStyle:  'italic',
  } as React.CSSProperties,
};

export default function PdfTemplate({ items, vesselName, inspectorName, reportTitle }: Props) {
  const date = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  return (
    <div style={S.root}>

      {/* ── 헤더 섹션 (별도 캡처 단위) ──────────────────────────────────────── */}
      <div data-pdf-section="header" style={S.headerWrap}>
        <div style={S.headerTitle}>
          <h1 style={S.headerTitleText}>{reportTitle || '선박 전수조사 점검표'}</h1>
        </div>
        <div style={S.headerInfo}>
          <span>선박명: {vesselName || '미기재'}</span>
          <span>점검일: {date}</span>
          <span>점검자: {inspectorName || '미기재'}</span>
        </div>
      </div>

      {/* ── 점검 항목 (항목별 별도 캡처 단위) ──────────────────────────────── */}
      {items.map((item) => (
        <div
          key={item.id}
          data-pdf-section={`item-${item.id}`}
          style={S.itemWrap}
        >
          {/* 항목 헤더 */}
          <div style={S.itemHeader}>
            <p style={S.itemTitleKo}>{item.no}. {item.titleKo}</p>
            <p style={S.itemTitleEn}>{item.titleEn}</p>
          </div>

          {/* 사진 슬롯 그리드 */}
          <div style={S.photoGrid}>
            {item.slots.map((slot) => (
              <div key={slot.id} style={S.photoCell}>
                <div style={S.slotLabel}>{slot.label}</div>
                {slot.preview ? (
                  <div style={S.photoBox}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slot.preview}
                      alt={slot.label}
                      style={S.photoImg}
                    />
                  </div>
                ) : (
                  <div style={S.photoEmpty}>— 사진 없음 —</div>
                )}
              </div>
            ))}
          </div>

          {/* Remark */}
          {item.remark && (
            <div style={S.remark}>
              <strong>📋 Remark</strong>
              <br />
              {item.remark.replace(/ \/ /g, '\n').split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* ── 서명 (마지막 캡처 단위) ─────────────────────────────────────────── */}
      <div data-pdf-section="footer" style={S.signature}>
        본 점검표는 {date} {inspectorName || '미기재'} 이(가) 작성하였습니다.
      </div>

    </div>
  );
}
