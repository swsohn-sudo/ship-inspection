'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Off-screen PDF report template for the Safety Inspection Checklist
//
// · Fixed 720px width — must match TEMPLATE_W in lib/generatePdf.ts
// · Each [data-pdf-section] element is captured individually by html2canvas
// · Uses inline styles only (Tailwind classes are unreliable off-screen)
// · Shows only NC items (items with photos) — the key deliverable for inspectors
// ─────────────────────────────────────────────────────────────────────────────

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

interface Props {
  inspection: { shipName: string; inspectionDate: string; inspector: string };
  sections: SectionData[];
  results: Record<string, ResultEntry>;
}

// ─── Inline style constants ───────────────────────────────────────────────────
const ROOT: React.CSSProperties = {
  width: '720px',
  fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  background: '#ffffff',
  color: '#1e293b',
  fontSize: '13px',
  lineHeight: '1.5',
};

const HEADER_WRAP: React.CSSProperties = { paddingBottom: '12px' };

const HEADER_TITLE: React.CSSProperties = {
  background: '#1e3a5f',
  color: '#ffffff',
  padding: '18px 24px',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center',
};

const HEADER_INFO: React.CSSProperties = {
  background: '#d6e4f0',
  padding: '10px 24px',
  borderRadius: '0 0 8px 8px',
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: '#1e3a5f',
  fontWeight: '600',
};

const NC_SUMMARY: React.CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '10px 16px',
  marginBottom: '4px',
  fontSize: '13px',
  color: '#dc2626',
  fontWeight: '700',
  textAlign: 'center',
};

const ALL_OK: React.CSSProperties = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '16px 24px',
  textAlign: 'center',
  color: '#16a34a',
  fontWeight: '700',
  fontSize: '15px',
};

const ITEM_WRAP: React.CSSProperties = {
  marginBottom: '12px',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid #bfd7ed',
};

const ITEM_HEADER: React.CSSProperties = {
  background: '#1e3a5f',
  color: '#ffffff',
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
};

const ITEM_NO_BADGE: React.CSSProperties = {
  background: '#dc2626',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 'bold',
  padding: '2px 8px',
  borderRadius: '12px',
  whiteSpace: 'nowrap',
  marginTop: '2px',
};

const ITEM_DESC: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.5',
  flex: 1,
};

const PHOTO_BOX: React.CSSProperties = {
  height: '320px',
  overflow: 'hidden',
  background: '#f8faff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const PHOTO_IMG: React.CSSProperties = {
  width: '100%',
  height: '320px',
  objectFit: 'cover',
  display: 'block',
};

const COMMENTS_BOX: React.CSSProperties = {
  background: '#fef9c3',
  padding: '10px 16px',
  borderTop: '1px solid #bfd7ed',
  fontSize: '12px',
  color: '#78350f',
};

const SECTION_SEP: React.CSSProperties = {
  background: '#e2eef8',
  color: '#1e3a5f',
  padding: '8px 16px',
  fontSize: '12px',
  fontWeight: '700',
  borderRadius: '6px',
  marginBottom: '8px',
  marginTop: '4px',
};

const FOOTER: React.CSSProperties = {
  padding: '12px 0 8px',
  textAlign: 'right',
  fontSize: '11px',
  color: '#64748b',
  fontStyle: 'italic',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function InspectionReportTemplate({ inspection, sections, results }: Props) {
  const date = new Date(inspection.inspectionDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Collect NC items grouped by section
  const ncSections = sections
    .map((sec) => ({
      ...sec,
      ncItems: sec.items.filter((item) => results[item.id]?.photo),
    }))
    .filter((sec) => sec.ncItems.length > 0);

  const totalNc = ncSections.reduce((sum, s) => sum + s.ncItems.length, 0);
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div style={ROOT}>

      {/* ── Header (captured as one PDF section) ── */}
      <div data-pdf-section="header" style={HEADER_WRAP}>
        <div style={HEADER_TITLE}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            Ship Safety Inspection Report
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.8 }}>
            Non-Conformity (NC) Items
          </p>
        </div>
        <div style={HEADER_INFO}>
          <span>Vessel: {inspection.shipName}</span>
          <span>Inspection Date: {date}</span>
          <span>Inspector: {inspection.inspector}</span>
        </div>

        {totalNc > 0 ? (
          <div style={{ ...NC_SUMMARY, marginTop: '8px' }}>
            🚨 {totalNc} Non-Conformity items found out of {totalItems} total items
          </div>
        ) : (
          <div style={{ ...ALL_OK, marginTop: '8px' }}>
            ✅ All {totalItems} items inspected — No Non-Conformities found
          </div>
        )}
      </div>

      {/* ── NC items grouped by section ── */}
      {ncSections.map((sec) => (
        <div key={sec.id}>
          {/* Section separator (captured with first item or separately) */}
          <div data-pdf-section={`sec-${sec.id}`} style={SECTION_SEP}>
            Section {sec.no}: {sec.nameEn}
            <span style={{
              marginLeft: '8px',
              background: '#dc2626',
              color: '#fff',
              borderRadius: '10px',
              padding: '1px 7px',
              fontSize: '11px',
            }}>
              {sec.ncItems.length} NC
            </span>
          </div>

          {sec.ncItems.map((item) => {
            const result = results[item.id]!;
            return (
              <div
                key={item.id}
                data-pdf-section={`item-${item.id}`}
                style={ITEM_WRAP}
              >
                {/* Item header */}
                <div style={ITEM_HEADER}>
                  <span style={ITEM_NO_BADGE}>NC · {item.itemNo}</span>
                  <span style={ITEM_DESC}>{item.description}</span>
                </div>

                {/* Photo */}
                <div style={PHOTO_BOX}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.photo!}
                    alt={`Defect photo for ${item.itemNo}`}
                    style={PHOTO_IMG}
                  />
                </div>

                {/* Comments */}
                {result.comments ? (
                  <div style={COMMENTS_BOX}>
                    <strong>Comment:</strong> {result.comments}
                  </div>
                ) : (
                  <div style={{ ...COMMENTS_BOX, color: '#94a3b8', fontStyle: 'italic' }}>
                    No additional comments
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* ── Footer ── */}
      <div data-pdf-section="footer" style={FOOTER}>
        Generated on {today} · Inspector: {inspection.inspector}
      </div>

    </div>
  );
}
