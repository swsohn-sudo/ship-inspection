import type { DeficiencyItem } from './deficiencyReport';
import { fetchOrExtractBase64 } from './imageUtils';

const BORDER = {
  top:    { style: 'thin', color: { argb: 'FF000000' } },
  left:   { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right:  { style: 'thin', color: { argb: 'FF000000' } },
} as const;

const BORDER_MED = {
  top:    { style: 'medium', color: { argb: 'FF991B1B' } },
  left:   { style: 'medium', color: { argb: 'FF991B1B' } },
  bottom: { style: 'medium', color: { argb: 'FF991B1B' } },
  right:  { style: 'medium', color: { argb: 'FF991B1B' } },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sc(cell: any, styles: Record<string, unknown>) {
  Object.assign(cell, styles);
}

export async function buildDeficiencyExcelBlob(
  inspection:   { shipName: string; inspectionDate: string; inspector: string },
  deficiencies: DeficiencyItem[],
): Promise<Blob> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exceljs: any = await import('exceljs');
  const ExcelJS = exceljs.default ?? exceljs;

  const DATE = new Date(inspection.inspectionDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = inspection.inspector || '';
  wb.created = new Date();

  // ============================================================
  // Sheet 1: Deficiency Photos
  // PDF와 동일 구조:
  //   Row A: 사진 (좌) | 사진 (우)        ← 높이 155
  //   Row B: Category + Section·ItemNo    ← 높이 28
  //   Row C: ■ Finding + Comments         ← 높이 32
  //   Row D: 구분선                        ← 높이 5
  // 2개 항목씩 좌우 배치, 6개/페이지
  // 컬럼: A~C (왼쪽), D~F (오른쪽)
  // ============================================================
  const ws = wb.addWorksheet('Deficiency List', {
    pageSetup: {
      paperSize:      9,           // A4
      orientation:    'portrait',
      fitToPage:      true,
      fitToWidth:     1,
      fitToHeight:    0,
      printTitlesRow: '1:2',
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0, footer: 0 },
    },
  });

  // A4 Portrait 유효너비 균등 6분할
  ws.getColumn('A').width = 16;
  ws.getColumn('B').width = 16;
  ws.getColumn('C').width = 16;
  ws.getColumn('D').width = 16;
  ws.getColumn('E').width = 16;
  ws.getColumn('F').width = 16;

  // ── 타이틀 행 ──────────────────────────────────────────────
  const titleRow = ws.addRow(['DEFICIENCY LIST', '', '', '', '', '']);
  ws.mergeCells('A1:F1');
  sc(ws.getCell('A1'), {
    value:     'DEFICIENCY LIST',
    font:      { bold: true, size: 16, color: { argb: 'FF7F1D1D' }, letterSpacing: 0.8 },
    alignment: { horizontal: 'left', vertical: 'middle' },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
    border:    { bottom: { style: 'medium', color: { argb: 'FF1E3A5F' } } },
  });
  titleRow.height = 28;

  // ── 정보 행 ────────────────────────────────────────────────
  const infoText =
    `Vessel: ${inspection.shipName}   ·   ${DATE}   ·   ` +
    `Inspector: ${inspection.inspector}   ·   Total: ${deficiencies.length} items`;
  const infoRow = ws.addRow([infoText, '', '', '', '', '']);
  ws.mergeCells('A2:F2');
  sc(ws.getCell('A2'), {
    value:     infoText,
    font:      { size: 8, color: { argb: 'FF475569' } },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border:    { bottom: { style: 'medium', color: { argb: 'FF1E3A5F' } } },
  });
  infoRow.height = 18;

  // 높이 설정
  const PHOTO_H   = 155;  // 사진 행
  const LOC_H     = 28;   // Category + Section 행
  const CMT_H     = 30;   // Finding 행
  const SPACER_H  = 5;    // 구분선

  // ── 항목 2개씩 처리 ─────────────────────────────────────────
  for (let i = 0; i < deficiencies.length; i += 2) {
    const L = deficiencies[i];
    const R = deficiencies[i + 1] ?? null;

    // 1) 사진 행
    const photoR = ws.addRow(['', '', '', '', '', '']);
    photoR.height = PHOTO_H;
    ws.mergeCells(`A${photoR.number}:C${photoR.number}`);
    ws.mergeCells(`D${photoR.number}:F${photoR.number}`);

    sc(ws.getCell(`A${photoR.number}`), {
      fill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
      border: BORDER,
    });
    sc(ws.getCell(`D${photoR.number}`), {
      fill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
      border: BORDER,
    });

    // 왼쪽 사진
    if (L.photo) {
      try {
        const b64 = await fetchOrExtractBase64(L.photo);
        const img = wb.addImage({ base64: b64, extension: 'jpeg' });
        ws.addImage(img, {
          tl: { col: 0, row: photoR.number - 1 },
          br: { col: 3, row: photoR.number },
          editAs: 'oneCell',
        });
      } catch {
        sc(ws.getCell(`A${photoR.number}`), {
          value:     'No Photo',
          font:      { size: 9, color: { argb: 'FF94A3B8' } },
          alignment: { horizontal: 'center', vertical: 'middle' },
        });
      }
    } else {
      sc(ws.getCell(`A${photoR.number}`), {
        value:     'No Photo',
        font:      { size: 9, color: { argb: 'FF94A3B8' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
      });
    }

    // 오른쪽 사진
    if (R?.photo) {
      try {
        const b64 = await fetchOrExtractBase64(R.photo);
        const img = wb.addImage({ base64: b64, extension: 'jpeg' });
        ws.addImage(img, {
          tl: { col: 3, row: photoR.number - 1 },
          br: { col: 6, row: photoR.number },
          editAs: 'oneCell',
        });
      } catch {
        sc(ws.getCell(`D${photoR.number}`), {
          value:     'No Photo',
          font:      { size: 9, color: { argb: 'FF94A3B8' } },
          alignment: { horizontal: 'center', vertical: 'middle' },
        });
      }
    } else {
      sc(ws.getCell(`D${photoR.number}`), {
        value:     R ? 'No Photo' : '',
        font:      { size: 9, color: { argb: 'FF94A3B8' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
      });
    }

    // 2) Location 행: Category + Section · Item No.
    const locR = ws.addRow(['', '', '', '', '', '']);
    locR.height = LOC_H;
    ws.mergeCells(`A${locR.number}:C${locR.number}`);
    ws.mergeCells(`D${locR.number}:F${locR.number}`);

    sc(ws.getCell(`A${locR.number}`), {
      value:     `${L.category}\n${L.sectionName}  ·  No. ${L.itemNo}`,
      font:      { bold: true, size: 9, color: { argb: 'FF1E3A5F' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } },
      border:    BORDER,
    });
    sc(ws.getCell(`D${locR.number}`), {
      value:     R ? `${R.category}\n${R.sectionName}  ·  No. ${R.itemNo}` : '',
      font:      { bold: true, size: 9, color: { argb: 'FF1E3A5F' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } },
      border:    BORDER,
    });

    // 3) Finding 행
    const cmtR = ws.addRow(['', '', '', '', '', '']);
    cmtR.height = CMT_H;
    ws.mergeCells(`A${cmtR.number}:C${cmtR.number}`);
    ws.mergeCells(`D${cmtR.number}:F${cmtR.number}`);

    sc(ws.getCell(`A${cmtR.number}`), {
      value:     `■ Finding\n${L.comments || '-'}`,
      font:      { size: 9, color: { argb: 'FF374151' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } },
      border:    BORDER,
    });
    sc(ws.getCell(`D${cmtR.number}`), {
      value:     R ? `■ Finding\n${R.comments || '-'}` : '',
      font:      { size: 9, color: { argb: 'FF374151' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } },
      border:    BORDER,
    });

    // 4) 구분선
    const spacer = ws.addRow(['', '', '', '', '', '']);
    ws.mergeCells(`A${spacer.number}:F${spacer.number}`);
    ws.getCell(`A${spacer.number}`).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' },
    };
    spacer.height = SPACER_H;
  }

  // ── 푸터 ───────────────────────────────────────────────────
  const today   = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const footRow = ws.addRow([
    `Generated: ${today}   ·   Inspector: ${inspection.inspector}   ·   Total: ${deficiencies.length} deficiencies`,
    '', '', '', '', '',
  ]);
  ws.mergeCells(`A${footRow.number}:F${footRow.number}`);
  sc(ws.getCell(`A${footRow.number}`), {
    font:      { size: 8, italic: true, color: { argb: 'FF64748B' } },
    alignment: { horizontal: 'right', vertical: 'middle' },
  });
  footRow.height = 18;

  ws.pageSetup.printArea = `A1:F${ws.lastRow?.number ?? 100}`;

  const xlsxBuffer = await wb.xlsx.writeBuffer();
  return new Blob([xlsxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}