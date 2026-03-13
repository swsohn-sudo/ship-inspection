// ─────────────────────────────────────────────────────────────────────────────
// PDF 보고서 생성 — @react-pdf/renderer (클라이언트 전용)
//
// 이전: html2canvas + jsPDF (off-screen DOM 캡처)
// 현재: @react-pdf/renderer pdf() — DOM 불필요, 2×3 그리드 A4 레이아웃
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import type { DeficiencyItem } from './deficiencyReport';

export async function buildPdfBlob(
  inspection: { shipName: string; inspectionDate: string; inspector: string },
  deficiencies: DeficiencyItem[],
): Promise<Blob> {
  // 동적 import: SSR 방지 + 코드 스플리팅
  const [{ pdf }, { default: PdfReport }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/app/components/PdfReport'),
  ]);

  const element = React.createElement(PdfReport, { inspection, deficiencies });

  // @react-pdf/renderer → PDF Blob
  const blob = await pdf(element as any).toBlob();
  return blob;
}
