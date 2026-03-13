'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Deficiency List — Off-screen PDF template
//
// · 고정 너비 720px (lib/generatePdf.ts의 TEMPLATE_W와 일치)
// · [data-pdf-section] 단위로 html2canvas가 개별 캡처
// · 인라인 스타일만 사용 (Tailwind 비적용 — html2canvas off-screen 호환)
// · 대분류 순서(CATEGORY_ORDER)로 정렬된 DeficiencyItem[] 을 받아 렌더
// ─────────────────────────────────────────────────────────────────────────────

import type { DeficiencyItem } from '@/lib/deficiencyReport';
import { groupByCategory, CATEGORY_ORDER } from '@/lib/deficiencyReport';

interface Props {
  inspection:   { shipName: string; inspectionDate: string; inspector: string };
  deficiencies: DeficiencyItem[];
}

// ─── 색상 상수 ────────────────────────────────────────────────────────────────
const RED_DARK   = '#7f1d1d';
const RED_MED    = '#991b1b';
const RED_LIGHT  = '#fee2e2';
const RED_BORDER = '#fecaca';
const NAVY       = '#1e3a5f';
const NAVY_LIGHT = '#d6e4f0';
const GRAY_BG    = '#f8fafc';
const YELLOW_BG  = '#fef9c3';
const SLATE_600  = '#475569';
const SLATE_400  = '#94a3b8';
const WHITE      = '#ffffff';

// ─── 인라인 스타일 상수 ───────────────────────────────────────────────────────
const ROOT: React.CSSProperties = {
  width:      '720px',
  fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  background: WHITE,
  color:      '#1e293b',
  fontSize:   '13px',
  lineHeight: '1.5',
};

// ── 헤더 섹션 ─────────────────────────────────────────────────────────────────
const HDR_WRAP: React.CSSProperties = { paddingBottom: '10px' };

const HDR_TITLE: React.CSSProperties = {
  background:   RED_DARK,
  color:        WHITE,
  padding:      '16px 24px',
  borderRadius: '8px 8px 0 0',
  textAlign:    'center',
};

const HDR_INFO: React.CSSProperties = {
  background:     RED_LIGHT,
  border:         `1px solid ${RED_BORDER}`,
  padding:        '8px 24px',
  display:        'flex',
  justifyContent: 'space-between',
  fontSize:       '12px',
  color:          RED_DARK,
  fontWeight:     '600',
};

const HDR_TOTAL: React.CSSProperties = {
  background:   RED_MED,
  color:        WHITE,
  padding:      '8px 24px',
  textAlign:    'center',
  fontSize:     '13px',
  fontWeight:   '700',
  borderRadius: '0 0 8px 8px',
};

// ── 대분류 요약 테이블 ──────────────────────────────────────────────────────────
const SUMMARY_WRAP: React.CSSProperties = {
  marginTop:    '10px',
  borderRadius: '8px',
  overflow:     'hidden',
  border:       `1px solid ${RED_BORDER}`,
};

const SUMMARY_HDR: React.CSSProperties = {
  background:  NAVY,
  color:       WHITE,
  padding:     '8px 16px',
  fontSize:    '11px',
  fontWeight:  '700',
  display:     'flex',
  justifyContent: 'space-between',
};

const SUMMARY_ROW: React.CSSProperties = {
  display:         'flex',
  justifyContent:  'space-between',
  alignItems:      'center',
  padding:         '5px 16px',
  fontSize:        '12px',
  borderTop:       '1px solid #f1f5f9',
};

// ── 항목 카드 ─────────────────────────────────────────────────────────────────
const CARD_WRAP: React.CSSProperties = {
  marginBottom: '10px',
  borderRadius: '8px',
  overflow:     'hidden',
  border:       `1px solid ${RED_BORDER}`,
};

const CARD_HDR: React.CSSProperties = {
  background: RED_DARK,
  color:      WHITE,
  padding:    '10px 14px',
  display:    'flex',
  alignItems: 'center',
  gap:        '10px',
};

const NO_BADGE: React.CSSProperties = {
  background:  WHITE,
  color:       RED_DARK,
  fontSize:    '12px',
  fontWeight:  'bold',
  padding:     '2px 9px',
  borderRadius:'12px',
  whiteSpace:  'nowrap',
};

const CAT_BADGE: React.CSSProperties = {
  background:  RED_MED,
  color:       WHITE,
  fontSize:    '10px',
  fontWeight:  '600',
  padding:     '2px 8px',
  borderRadius:'10px',
  whiteSpace:  'nowrap',
};

const SEC_INFO: React.CSSProperties = {
  fontSize:   '12px',
  color:      '#fecaca',
  marginLeft: 'auto',
  whiteSpace: 'nowrap',
};

const DESC_BOX: React.CSSProperties = {
  background: '#fff5f5',
  padding:    '8px 14px',
  fontSize:   '12px',
  color:      '#374151',
  borderTop:  `1px solid ${RED_BORDER}`,
};

const PHOTO_BOX: React.CSSProperties = {
  height:          '200px',
  overflow:        'hidden',
  background:      GRAY_BG,
  borderTop:       `1px solid ${RED_BORDER}`,
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
};

const PHOTO_IMG: React.CSSProperties = {
  width:     '100%',
  height:    '200px',
  objectFit: 'cover',
  display:   'block',
};

const COMMENT_BOX: React.CSSProperties = {
  background:  YELLOW_BG,
  padding:     '8px 14px',
  fontSize:    '12px',
  color:       '#78350f',
  borderTop:   `1px solid #fde68a`,
};

// ── 대분류 구분선 ──────────────────────────────────────────────────────────────
const CAT_SEP: React.CSSProperties = {
  background:   NAVY,
  color:        WHITE,
  padding:      '7px 14px',
  fontSize:     '12px',
  fontWeight:   '700',
  borderRadius: '6px',
  marginBottom: '6px',
  marginTop:    '4px',
  display:      'flex',
  justifyContent: 'space-between',
  alignItems:   'center',
};

// ── 푸터 ──────────────────────────────────────────────────────────────────────
const FOOTER: React.CSSProperties = {
  padding:    '10px 0 6px',
  textAlign:  'right',
  fontSize:   '10px',
  color:      SLATE_400,
  fontStyle:  'italic',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function DeficiencyReportTemplate({ inspection, deficiencies }: Props) {
  const date = new Date(inspection.inspectionDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const groups = groupByCategory(deficiencies);

  // 대분류별 카운트 (요약 테이블용)
  const categorySummary = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      count:    deficiencies.filter((d) => d.category === cat).length,
    }))
    .filter((c) => c.count > 0);

  return (
    <div style={ROOT}>

      {/* ══════════════════════════════════════════════════════
          헤더 섹션 (= 1개의 pdf-section)
      ══════════════════════════════════════════════════════ */}
      <div data-pdf-section="header" style={HDR_WRAP}>

        {/* 제목 바 */}
        <div style={HDR_TITLE}>
          <div style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            DEFICIENCY LIST
          </div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.85 }}>
            Ship Safety Inspection Report
          </div>
        </div>

        {/* 선박 정보 바 */}
        <div style={HDR_INFO}>
          <span>Vessel: {inspection.shipName}</span>
          <span>Inspection Date: {date}</span>
          <span>Inspector: {inspection.inspector}</span>
        </div>

        {/* 총 결함 수 */}
        <div style={HDR_TOTAL}>
          🚨 Total Deficiencies: {deficiencies.length} items requiring corrective action
        </div>

        {/* 대분류 요약 테이블 */}
        <div style={SUMMARY_WRAP}>
          <div style={SUMMARY_HDR}>
            <span>Category</span>
            <span>Deficiencies</span>
          </div>
          {categorySummary.map(({ category, count }, i) => (
            <div
              key={category}
              style={{
                ...SUMMARY_ROW,
                background: i % 2 === 0 ? WHITE : '#f9fafb',
              }}
            >
              <span style={{ color: SLATE_600 }}>{category}</span>
              <span style={{
                fontWeight:  'bold',
                color:        RED_MED,
                background:   RED_LIGHT,
                padding:      '1px 8px',
                borderRadius: '10px',
                fontSize:     '11px',
              }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          대분류별 → 항목 카드
      ══════════════════════════════════════════════════════ */}
      {groups.map((group) => (
        <div key={group.category}>

          {/* 대분류 구분선 (별도 pdf-section) */}
          <div
            data-pdf-section={`cat-${group.category}`}
            style={CAT_SEP}
          >
            <span>{group.category}</span>
            <span style={{
              background:   RED_MED,
              color:        WHITE,
              borderRadius: '10px',
              padding:      '1px 8px',
              fontSize:     '11px',
            }}>
              {group.items.length} item{group.items.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* 항목 카드 (각 카드 = 1개 pdf-section) */}
          {group.items.map((item) => (
            <div
              key={item.no}
              data-pdf-section={`item-${item.no}`}
              style={CARD_WRAP}
            >
              {/* 카드 헤더 */}
              <div style={CARD_HDR}>
                <span style={NO_BADGE}>No.{item.no}</span>
                <span style={CAT_BADGE}>{item.category}</span>
                <span style={SEC_INFO}>
                  Sec {item.sectionNo} {item.sectionName} · {item.itemNo}
                </span>
              </div>

              {/* 항목 설명 */}
              <div style={DESC_BOX}>
                <span style={{ fontWeight: '600', color: NAVY, marginRight: '6px' }}>
                  Description:
                </span>
                {item.description}
              </div>

              {/* 사진 */}
              <div style={PHOTO_BOX}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.photo}
                  alt={`Deficiency No.${item.no}`}
                  style={PHOTO_IMG}
                />
              </div>

              {/* 코멘트 */}
              <div style={COMMENT_BOX}>
                <span style={{ fontWeight: '700', marginRight: '6px' }}>💬 Finding:</span>
                {item.comments}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* ══════════════════════════════════════════════════════
          푸터
      ══════════════════════════════════════════════════════ */}
      <div data-pdf-section="footer" style={FOOTER}>
        Generated: {today} · Inspector: {inspection.inspector} · {deficiencies.length} deficiencies
      </div>

    </div>
  );
}
