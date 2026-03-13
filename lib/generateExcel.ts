import type { InspectionItem } from './inspectionData';
import { compressForExport, dataUrlToBase64 } from './imageUtils';

// ─── 공통 스타일 상수 ─────────────────────────────────────────────────────────
const BORDER_THIN = {
  top:    { style: 'thin',   color: { argb: 'FFBFD7ED' } },
  left:   { style: 'thin',   color: { argb: 'FFBFD7ED' } },
  bottom: { style: 'thin',   color: { argb: 'FFBFD7ED' } },
  right:  { style: 'thin',   color: { argb: 'FFBFD7ED' } },
} as const;

const BORDER_MEDIUM = {
  top:    { style: 'medium', color: { argb: 'FF2C5F8A' } },
  left:   { style: 'medium', color: { argb: 'FF2C5F8A' } },
  bottom: { style: 'medium', color: { argb: 'FF2C5F8A' } },
  right:  { style: 'medium', color: { argb: 'FF2C5F8A' } },
} as const;

// ─── File → 내보내기용 압축 후 순수 Base64 문자열 ────────────────────────────
// compressForExport (max 800px / JPEG 0.72) 적용 후 헤더 제거
// · 업로드 시 1차 압축(1024px/0.80)에 더해 내보내기 전 2차 압축
// · 목표: 엑셀 내 사진 1장당 약 150~280KB
async function fileToExportBase64(file: File): Promise<string> {
  const dataUrl = await compressForExport(file);
  return dataUrlToBase64(dataUrl);
}


// ─── 엑셀 보고서 Blob 생성 (100% 브라우저 실행) ────────────────────────────────
export async function buildExcelBlob(
  items: InspectionItem[],
  vesselName: string,
  inspectorName: string,
  reportTitle = 'SQT Official Document Reply App',
): Promise<Blob> {

  // ══════════════════════════════════════════════════════════════
  // Phase 1: 모든 사진 → Base64 병렬 변환 (Promise.all)
  //   · writeBuffer() 는 이 Map 이 완전히 채워진 이후에만 실행됨
  //   · 개별 실패는 try-catch 로 흡수 → 나머지 사진/엑셀 생성은 계속 진행
  // ══════════════════════════════════════════════════════════════
  // compressImage 가 항상 image/png 로 출력하므로 extension 은 'png' 고정
  const imgMap = new Map<string, string>(); // slotId → 순수 base64

  await Promise.all(
    items.flatMap((item) =>
      item.slots
        .filter((slot) => slot.photo != null)
        .map(async (slot) => {
          try {
            const base64 = await fileToExportBase64(slot.photo!);
            imgMap.set(slot.id, base64);
          } catch (e) {
            // 해당 슬롯만 건너뜀 — 엑셀 생성 중단 없음
            console.error(`[Excel] 사진 변환 실패 (${slot.label}):`, e);
          }
        }),
    ),
  );

  // ══════════════════════════════════════════════════════════════
  // Phase 2: ExcelJS 동적 import + 워크북 초기화
  // ══════════════════════════════════════════════════════════════
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exceljs: any = await import('exceljs');
  const ExcelJS = exceljs.default ?? exceljs;

  const date = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\s/g, '');

  const wb = new ExcelJS.Workbook();
  wb.creator = inspectorName || '미기재';
  wb.created = new Date();

  const ws = wb.addWorksheet('점검표', {
    pageSetup: {
      paperSize:      9,         // A4
      orientation:    'portrait',
      fitToPage:      true,
      fitToWidth:     1,
      fitToHeight:    0,
      printTitlesRow: '1:2',
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0, footer: 0 },
    },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
  });

  // 라벨 열(A, C): 16 / 사진 열(B, D): 36
  // 모바일 뷰어는 열 너비가 좁으면 이미지 렌더링을 생략함 → 최소 36 이상 확보
  ws.getColumn('A').width = 16;
  ws.getColumn('B').width = 36;
  ws.getColumn('C').width = 16;
  ws.getColumn('D').width = 36;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function styleCell(cell: any, styles: Record<string, unknown>) {
    Object.assign(cell, styles);
  }

  // ── 헬퍼: 이미지 1장 삽입 ────────────────────────────────────────────────────
  // tl(top-left) + br(bottom-right) 두 셀 좌표로 셀에 꽉 차게 배치
  // editAs: 'oneCell' → 셀 크기 변화 시 이미지도 함께 조정됨 (PC Excel 최적화)
  function placeImage(
    slotId:          string,
    colTl:           number,   // 0-indexed tl col
    colBr:           number,   // 0-indexed br col (exclusive)
    rowIdx:          number,   // 0-indexed row
    noPhotoCellAddr: string,
    fallbackLabel:   string,
  ) {
    const base64 = imgMap.get(slotId);
    if (base64) {
      try {
        const imgId = wb.addImage({ base64, extension: 'jpeg' });
        ws.addImage(imgId, {
          tl:     { col: colTl, row: rowIdx },
          br:     { col: colBr, row: rowIdx + 1 },
          editAs: 'oneCell',
        });
      } catch (e) {
        console.error(`[Excel] ws.addImage 실패 (${fallbackLabel}):`, e);
        styleCell(ws.getCell(noPhotoCellAddr), {
          value:     '이미지 삽입 실패',
          font:      { size: 9, color: { argb: 'FFEF4444' } },
          alignment: { horizontal: 'center', vertical: 'middle' },
        });
      }
    } else {
      styleCell(ws.getCell(noPhotoCellAddr), {
        value:     '— 사진 없음 —',
        font:      { size: 10, color: { argb: 'FFCBD5E1' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
      });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Row 1: 보고서 제목
  // ══════════════════════════════════════════════════════════════
  const titleRow = ws.addRow([reportTitle || '선박 전수조사 점검표', '', '', '']);
  ws.mergeCells(`A${titleRow.number}:D${titleRow.number}`);
  styleCell(ws.getCell(`A${titleRow.number}`), {
    value:     reportTitle || '선박 전수조사 점검표',
    font:      { bold: true, size: 18, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
  });
  titleRow.height = 52;

  // ══════════════════════════════════════════════════════════════
  // Row 2: 기본 정보
  // ══════════════════════════════════════════════════════════════
  const infoRow = ws.addRow([
    `선박명: ${vesselName || '미기재'}          점검일: ${date}          점검자: ${inspectorName || '미기재'}`,
    '', '', '',
  ]);
  ws.mergeCells(`A${infoRow.number}:D${infoRow.number}`);
  styleCell(ws.getCell(`A${infoRow.number}`), {
    font:      { size: 11, color: { argb: 'FF1E3A5F' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } },
    border:    BORDER_MEDIUM,
  });
  infoRow.height = 30;

  // ══════════════════════════════════════════════════════════════
  // Phase 3: 점검 항목 반복
  //   imgMap 이 완전히 채워진 상태이므로 placeImage 는 동기 호출
  // ══════════════════════════════════════════════════════════════
  // 사진 행 높이: 모바일 뷰어의 최소 렌더링 임계값을 넘기기 위해 190으로 설정
  const PHOTO_H = 190;

  for (const item of items) {
    const titleText = `${item.no}.  ${item.titleKo}`;
    const koRow = ws.addRow([titleText, '', '', '']);
    ws.mergeCells(`A${koRow.number}:D${koRow.number}`);
    styleCell(ws.getCell(`A${koRow.number}`), {
      value:     titleText,
      font:      { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
      border:    BORDER_MEDIUM,
    });
    koRow.height = item.titleKo.length > 40 ? 52 : 40;

    const enRow = ws.addRow([item.titleEn, '', '', '']);
    ws.mergeCells(`A${enRow.number}:D${enRow.number}`);
    styleCell(ws.getCell(`A${enRow.number}`), {
      value:     item.titleEn,
      font:      { size: 9, italic: true, color: { argb: 'FF334155' } },
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EEF8' } },
      border:    BORDER_THIN,
    });
    enRow.height = item.titleEn.length > 80 ? 32 : 24;

    for (let i = 0; i < item.slots.length; i += 2) {
      const slotL = item.slots[i];
      const slotR = item.slots[i + 1] ?? null;

      const photoRow = ws.addRow([slotL.label, '', slotR ? slotR.label : '', '']);
      photoRow.height = PHOTO_H;
      const rowNum = photoRow.number;
      const rowIdx = rowNum - 1; // 0-indexed

      styleCell(ws.getCell(`A${rowNum}`), {
        font:      { bold: true, size: 10, color: { argb: 'FFFFFFFF' }, name: 'Consolas' },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C4A6E' } },
        border:    BORDER_THIN,
      });
      styleCell(ws.getCell(`B${rowNum}`), {
        fill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFCFF' } },
        border: BORDER_THIN,
      });

      if (slotR) {
        styleCell(ws.getCell(`C${rowNum}`), {
          font:      { bold: true, size: 10, color: { argb: 'FFFFFFFF' }, name: 'Consolas' },
          alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
          fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C4A6E' } },
          border:    BORDER_THIN,
        });
        styleCell(ws.getCell(`D${rowNum}`), {
          fill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFCFF' } },
          border: BORDER_THIN,
        });
      } else {
        ws.mergeCells(`C${rowNum}:D${rowNum}`);
        styleCell(ws.getCell(`C${rowNum}`), {
          fill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
          border: BORDER_THIN,
        });
      }

      // 왼쪽 이미지: B열 (col 1→2, 0-indexed)
      placeImage(slotL.id, 1, 2, rowIdx, `B${rowNum}`, slotL.label);

      // 오른쪽 이미지: D열 (col 3→4, 0-indexed)
      if (slotR) {
        placeImage(slotR.id, 3, 4, rowIdx, `D${rowNum}`, slotR.label);
      }
    }

    if (item.remark) {
      const remarkText = item.remark.replace(/ \/ /g, '\n');
      const lineCount  = (remarkText.match(/\n/g) ?? []).length + 1;
      const remRow = ws.addRow([`📋  Remark\n${remarkText}`, '', '', '']);
      ws.mergeCells(`A${remRow.number}:D${remRow.number}`);
      styleCell(ws.getCell(`A${remRow.number}`), {
        value:     `📋  Remark\n${remarkText}`,
        font:      { size: 10, italic: true, color: { argb: 'FF78350F' } },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true, indent: 1 },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } },
        border:    BORDER_THIN,
      });
      remRow.height = Math.max(40, lineCount * 18 + 12);
    }

    const sepRow = ws.addRow(['', '', '', '']);
    ws.mergeCells(`A${sepRow.number}:D${sepRow.number}`);
    ws.getCell(`A${sepRow.number}`).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' },
    };
    sepRow.height = 8;
  }

  const sigRow = ws.addRow([
    `본 점검표는 ${date} ${inspectorName || '미기재'} 이(가) 작성하였습니다.`,
    '', '', '',
  ]);
  ws.mergeCells(`A${sigRow.number}:D${sigRow.number}`);
  styleCell(ws.getCell(`A${sigRow.number}`), {
    font:      { size: 10, italic: true, color: { argb: 'FF64748B' } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } },
  });
  sigRow.height = 24;

  ws.pageSetup.printArea = `A1:D${ws.lastRow?.number ?? 100}`;

  // ══════════════════════════════════════════════════════════════
  // Phase 4: 직렬화 — imgMap 수집 + 워크시트 구성 완료 후 실행
  // ══════════════════════════════════════════════════════════════
  const xlsxBuffer = await wb.xlsx.writeBuffer();
  return new Blob([xlsxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
