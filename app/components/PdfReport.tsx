'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Deficiency List — @react-pdf/renderer Document
//
// Layout : A4 Portrait · Margin 18pt · 2 col × 3 row = 6 items / page
// Item   : [Photo cell] + [Location cell] + [Comments cell]  — each 1pt black border
// Font   : Malgun Gothic (requires /public/fonts/malgun.ttf)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  StyleSheet,
} from '@react-pdf/renderer';
import type { DeficiencyItem } from '@/lib/deficiencyReport';

// ── 폰트 등록 (/public/fonts/malgun.ttf 필요) ─────────────────────────────────
Font.register({
  family: 'MalgunGothic',
  fonts: [
    { src: '/fonts/malgun.ttf',   fontWeight: 'normal' },
    { src: '/fonts/malgunbd.ttf', fontWeight: 'bold'   },
  ],
});
// 한글 하이픈 비활성화
Font.registerHyphenationCallback((word) => [word]);

// ── A4 치수 계산 (단위: pt) ───────────────────────────────────────────────────
const A4_W      = 595.28;
const A4_H      = 841.89;
const MARGIN    = 18;           // 상하좌우 여백
const HDR_H     = 46;           // 페이지 헤더 높이
const FOOTER_H  = 14;           // 페이지 번호 영역 높이
const ITEM_GAP  = 4;            // 아이템 간격

const CONTENT_W = A4_W - MARGIN * 2;                               // 559.28 pt
const CONTENT_H = A4_H - MARGIN * 2 - HDR_H - FOOTER_H - 6;      // ≈ 739 pt

const COL_W  = (CONTENT_W - ITEM_GAP)  / 2;                       // ≈ 277.64 pt
const ROW_H  = (CONTENT_H - ITEM_GAP * 2) / 3;                    // ≈ 243.67 pt

// 각 셀 높이 비율
const PHOTO_H = Math.round(ROW_H * 0.63);   // ≈ 153 pt
const LOC_H   = 34;                          // Location 셀 고정
const CMT_H   = ROW_H - PHOTO_H - LOC_H;    // ≈ 57 pt

// ── 공통 테두리 ───────────────────────────────────────────────────────────────
const BORDER = {
  borderWidth: 1,
  borderColor: '#000000',
  borderStyle: 'solid',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily:      'MalgunGothic',
    fontSize:        10,
    paddingTop:      MARGIN,
    paddingBottom:   MARGIN + FOOTER_H,
    paddingLeft:     MARGIN,
    paddingRight:    MARGIN,
    backgroundColor: '#ffffff',
  },

  // ── 페이지 헤더 ─────────────────────────────────────────────────────────────
  pageHeader: {
    height:            HDR_H,
    flexDirection:     'row',
    alignItems:        'flex-end',
    justifyContent:    'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#1e3a5f',
    borderBottomStyle: 'solid',
    paddingBottom:     4,
    marginBottom:      4,
  },
  hdrLeft:  { flex: 1 },
  hdrTitle: { fontSize: 14, fontWeight: 'bold', color: '#7f1d1d', letterSpacing: 0.8 },
  hdrSub:   { fontSize: 8,  color: '#475569', marginTop: 2 },
  hdrRight: { fontSize: 8,  color: '#94a3b8', textAlign: 'right' },

  // ── 2×3 그리드 ──────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
  },

  // ── 아이템 카드 (좌측 열: marginRight 있음) ──────────────────────────────────
  itemCardLeft: {
    width:        COL_W,
    height:       ROW_H,
    marginRight:  ITEM_GAP,
    marginBottom: ITEM_GAP,
  },
  itemCardRight: {
    width:        COL_W,
    height:       ROW_H,
    marginRight:  0,
    marginBottom: ITEM_GAP,
  },

  // ── 사진 셀 ──────────────────────────────────────────────────────────────────
  photoCell: {
    ...BORDER,
    width:           COL_W,
    height:          PHOTO_H,
    backgroundColor: '#e2e8f0',
    overflow:        'hidden',
  },
  photo: {
    width:     COL_W,
    height:    PHOTO_H,
    objectFit: 'cover',
  },
  noPhoto: {
    width:          COL_W,
    height:         PHOTO_H,
    alignItems:     'center',
    justifyContent: 'center',
  },
  noPhotoText: {
    fontSize: 9,
    color:    '#94a3b8',
  },

  // ── Location 셀 (대분류 + 세부항목명) ──────────────────────────────────────
  locationCell: {
    ...BORDER,
    borderTopWidth:  0,
    width:           COL_W,
    height:          LOC_H,
    backgroundColor: '#f0f4f8',
    justifyContent:  'center',
    alignItems:      'center',
    paddingHorizontal: 4,
    paddingVertical:   2,
  },
  locCat: {
    textAlign:  'center',
    fontSize:   9,
    fontWeight: 'bold',
    color:      '#1e3a5f',
  },
  locSub: {
    textAlign: 'center',
    fontSize:  7.5,
    color:     '#64748b',
    marginTop: 1,
  },

  // ── Comments 셀 ──────────────────────────────────────────────────────────────
  commentsCell: {
    ...BORDER,
    borderTopWidth:  0,
    width:           COL_W,
    height:          CMT_H,
    backgroundColor: '#fffbeb',
    justifyContent:  'center',
    alignItems:      'center',
    paddingHorizontal: 4,
    paddingVertical:   3,
  },
  cmmLabel: {
    textAlign:   'center',
    fontSize:    7,
    fontWeight:  'bold',
    color:       '#92400e',
    marginBottom: 2,
  },
  cmmText: {
    textAlign:  'center',
    fontSize:   8.5,
    color:      '#374151',
    lineHeight: 1.4,
  },

  // ── 페이지 번호 ──────────────────────────────────────────────────────────────
  pageNum: {
    position:  'absolute',
    bottom:    8,
    right:     MARGIN,
    fontSize:  8,
    color:     '#94a3b8',
    textAlign: 'right',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Props & constants
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  inspection:   { shipName: string; inspectionDate: string; inspector: string };
  deficiencies: DeficiencyItem[];
}

const ITEMS_PER_PAGE = 6;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PdfReport({ inspection, deficiencies }: Props) {
  const dateStr = new Date(inspection.inspectionDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // 6개씩 페이지 분할
  const pages: DeficiencyItem[][] = [];
  for (let i = 0; i < deficiencies.length; i += ITEMS_PER_PAGE) {
    pages.push(deficiencies.slice(i, i + ITEMS_PER_PAGE));
  }
  const totalPages = pages.length;

  return (
    <Document
      title={`Deficiency List — ${inspection.shipName}`}
      author={inspection.inspector}
      creator="Ship Safety Inspection App"
    >
      {pages.map((items, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>

          {/* ── 페이지 헤더 ── */}
          <View style={styles.pageHeader}>
            <View style={styles.hdrLeft}>
              <Text style={styles.hdrTitle}>DEFICIENCY LIST</Text>
              <Text style={styles.hdrSub}>
                {`Vessel: ${inspection.shipName}  ·  ${dateStr}  ·  Inspector: ${inspection.inspector}  ·  Total: ${deficiencies.length} items`}
              </Text>
            </View>
            <Text style={styles.hdrRight}>
              {`Page ${pageIdx + 1} / ${totalPages}`}
            </Text>
          </View>

          {/* ── 2×3 그리드 ── */}
          <View style={styles.grid}>
            {items.map((item, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <View
                  key={item.no}
                  style={isLeft ? styles.itemCardLeft : styles.itemCardRight}
                >
                  {/* 사진 셀 */}
                  <View style={styles.photoCell}>
                    {item.photo ? (
                      <Image src={item.photo} style={styles.photo} />
                    ) : (
                      <View style={styles.noPhoto}>
                        <Text style={styles.noPhotoText}>— No Photo —</Text>
                      </View>
                    )}
                  </View>

                  {/* Location 셀: 대분류 + 섹션·항목번호 */}
                  <View style={styles.locationCell}>
                    <Text style={styles.locCat}>{item.category}</Text>
                    <Text style={styles.locSub}>
                      {`${item.sectionName}  ·  No. ${item.itemNo}`}
                    </Text>
                  </View>

                  {/* Comments 셀 */}
                  <View style={styles.commentsCell}>
                    <Text style={styles.cmmLabel}>■ Finding</Text>
                    <Text style={styles.cmmText}>{item.comments}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── 페이지 번호 (하단 우측) ── */}
          <Text style={styles.pageNum}>
            {`${pageIdx + 1} / ${totalPages}`}
          </Text>

        </Page>
      ))}
    </Document>
  );
}
