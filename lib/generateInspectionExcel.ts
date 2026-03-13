// ─────────────────────────────────────────────────────────────────────────────
// Excel report builder for the Safety Inspection Checklist (new DB data model)
//
// Produces a two-sheet workbook:
//   Sheet 1 "Inspection Summary" — all 325 items (Section header + item rows)
//   Sheet 2 "NC Photos"          — NC items only, each with embedded photo
//
// Photos are stored as base64 data URLs in the DB, so no File→base64 conversion
// is needed (unlike the legacy buildExcelBlob in generateExcel.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { dataUrlToBase64 } from './imageUtils';

// ─── Types (mirrors InspectionClient's local types) ──────────────────────────
type ItemData = {
  id: string;
  itemNo: string;
  description: string;
  riskScore: number;
};

type SectionData = {
  id: string;
  no: number;
  nameEn: string;
  items: ItemData[];
};

type ResultEntry = {
  photo: string | null;
  comments: string;
};

// ─── Shared border styles ─────────────────────────────────────────────────────
const BORDER_THIN = {
  top:    { style: 'thin', color: { argb: 'FFBFD7ED' } },
  left:   { style: 'thin', color: { argb: 'FFBFD7ED' } },
  bottom: { style: 'thin', color: { argb: 'FFBFD7ED' } },
  right:  { style: 'thin', color: { argb: 'FFBFD7ED' } },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function styleCell(cell: any, styles: Record<string, unknown>) {
  Object.assign(cell, styles);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export async function buildInspectionExcelBlob(
  inspection: { shipName: string; inspectionDate: string; inspector: string },
  sections: SectionData[],
  results: Record<string, ResultEntry>,
): Promise<Blob> {
  // Dynamic import — keeps ExcelJS out of the initial bundle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exceljs: any = await import('exceljs');
  const ExcelJS = exceljs.default ?? exceljs;

  const wb = new ExcelJS.Workbook();
  wb.creator = inspection.inspector || '—';
  wb.created = new Date();

  const DATE = new Date(inspection.inspectionDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const allItems = sections.flatMap((s) => s.items);
  const ncCount  = allItems.filter((i) => results[i.id]?.photo).length;

  // ════════════════════════════════════════════════════════════════════════════
  // Sheet 1: Inspection Summary
  // ════════════════════════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet('Inspection Summary', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }],
    pageSetup: {
      paperSize: 9, orientation: 'portrait',
      fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0, footer: 0 },
    },
  });

  ws1.getColumn('A').width = 10;  // Item No
  ws1.getColumn('B').width = 62;  // Description
  ws1.getColumn('C').width = 8;   // Risk
  ws1.getColumn('D').width = 10;  // Status
  ws1.getColumn('E').width = 42;  // Comments

  // ── Title row ──
  const t1 = ws1.addRow(['Ship Safety Inspection Report', '', '', '', '']);
  ws1.mergeCells('A1:E1');
  styleCell(ws1.getCell('A1'), {
    value: 'Ship Safety Inspection Report',
    font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
  });
  t1.height = 42;

  // ── Info row ──
  const i1 = ws1.addRow([
    `Vessel: ${inspection.shipName}     Date: ${DATE}     Inspector: ${inspection.inspector}     NC Items: ${ncCount} / ${allItems.length}`,
    '', '', '', '',
  ]);
  ws1.mergeCells('A2:E2');
  styleCell(ws1.getCell('A2'), {
    font: { size: 11, color: { argb: 'FF1E3A5F' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } },
  });
  i1.height = 28;

  // ── Column headers ──
  const ch1 = ws1.addRow(['Item No', 'Description', 'Risk', 'Status', 'Comments']);
  ch1.height = 22;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ch1.eachCell((cell: any) => {
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C4A6E' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_THIN;
  });

  // ── Section + item rows ──
  for (const section of sections) {
    const secRow = ws1.addRow([`${section.no}.  ${section.nameEn}`, '', '', '', '']);
    ws1.mergeCells(`A${secRow.number}:E${secRow.number}`);
    styleCell(ws1.getCell(`A${secRow.number}`), {
      value: `${section.no}.  ${section.nameEn}`,
      font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
    });
    secRow.height = 26;

    for (const item of section.items) {
      const result = results[item.id];
      const isNC   = Boolean(result?.photo);

      const row = ws1.addRow([
        item.itemNo,
        item.description,
        item.riskScore,
        isNC ? 'NC' : 'OK',
        result?.comments ?? '',
      ]);
      row.height = 18;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      row.eachCell({ includeEmpty: true }, (cell: any, col: number) => {
        cell.border = BORDER_THIN;
        cell.alignment = { vertical: 'middle', wrapText: col === 2 || col === 5 };
        if (col === 3) cell.alignment = { ...cell.alignment, horizontal: 'center' };
      });

      // Colour the Status cell
      const statusCell = row.getCell(4);
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (isNC) {
        statusCell.font = { bold: true, color: { argb: 'FFDC2626' } };
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
      } else {
        statusCell.font = { bold: true, color: { argb: 'FF16A34A' } };
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      }
    }
  }

  ws1.pageSetup.printArea = `A1:E${ws1.lastRow?.number ?? 100}`;

  // ════════════════════════════════════════════════════════════════════════════
  // Sheet 2: NC Photos  (only created when there are NC items)
  // ════════════════════════════════════════════════════════════════════════════
  const ncItems = sections.flatMap((s) =>
    s.items
      .filter((i) => results[i.id]?.photo)
      .map((i) => ({ ...i, sectionNo: s.no, sectionName: s.nameEn })),
  );

  if (ncItems.length > 0) {
    const ws2 = wb.addWorksheet('NC Photos', {
      pageSetup: {
        paperSize: 9, orientation: 'portrait',
        fitToPage: true, fitToWidth: 1, fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0, footer: 0 },
      },
    });

    ws2.getColumn('A').width = 18;   // Item label
    ws2.getColumn('B').width = 62;   // Description
    ws2.getColumn('C').width = 42;   // Comments

    // ── Title ──
    const t2 = ws2.addRow(['NC Items with Photos', '', '']);
    ws2.mergeCells('A1:C1');
    styleCell(ws2.getCell('A1'), {
      value: 'NC Items with Photos',
      font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } },
    });
    t2.height = 36;

    // ── Info ──
    const i2 = ws2.addRow([
      `Vessel: ${inspection.shipName}     Date: ${DATE}     Inspector: ${inspection.inspector}     NC: ${ncItems.length} items`,
      '', '',
    ]);
    ws2.mergeCells('A2:C2');
    styleCell(ws2.getCell('A2'), {
      font: { size: 10, color: { argb: 'FF1E3A5F' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } },
    });
    i2.height = 24;

    // ── Column headers ──
    const ch2 = ws2.addRow(['Item', 'Description', 'Comments']);
    ch2.height = 22;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ch2.eachCell((cell: any) => {
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C4A6E' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = BORDER_THIN;
    });

    const PHOTO_H = 180; // row height for photo rows

    for (const item of ncItems) {
      const result = results[item.id]!;

      // ── Info row (item label | description | comments) ──
      const infoRow = ws2.addRow([
        `${item.itemNo}  (Sec ${item.sectionNo})`,
        item.description,
        result.comments ?? '',
      ]);
      infoRow.height = 36;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      infoRow.eachCell({ includeEmpty: true }, (cell: any, col: number) => {
        cell.border = BORDER_THIN;
        cell.alignment = { vertical: 'middle', wrapText: col !== 1 };
      });
      styleCell(infoRow.getCell(1), {
        font: { bold: true, color: { argb: 'FFDC2626' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
      });

      // ── Photo row (full width, merged A:C) ──
      const photoRow = ws2.addRow(['', '', '']);
      photoRow.height = PHOTO_H;
      ws2.mergeCells(`A${photoRow.number}:C${photoRow.number}`);
      styleCell(ws2.getCell(`A${photoRow.number}`), {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } },
        border: BORDER_THIN,
      });

      try {
        const base64 = dataUrlToBase64(result.photo!);
        const imgId  = wb.addImage({ base64, extension: 'jpeg' });
        ws2.addImage(imgId, {
          tl:     { col: 0, row: photoRow.number - 1 },
          br:     { col: 3, row: photoRow.number },
          editAs: 'oneCell',
        });
      } catch (e) {
        console.error(`[Excel] Photo embed failed for ${item.itemNo}:`, e);
        styleCell(ws2.getCell(`A${photoRow.number}`), {
          value:     '— Photo unavailable —',
          font:      { size: 11, color: { argb: 'FFCBD5E1' } },
          alignment: { horizontal: 'center', vertical: 'middle' },
        });
      }

      // ── Spacer row ──
      const spacer = ws2.addRow(['', '', '']);
      ws2.mergeCells(`A${spacer.number}:C${spacer.number}`);
      ws2.getCell(`A${spacer.number}`).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' },
      };
      spacer.height = 6;
    }

    ws2.pageSetup.printArea = `A1:C${ws2.lastRow?.number ?? 100}`;
  }

  const xlsxBuffer = await wb.xlsx.writeBuffer();
  return new Blob([xlsxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
