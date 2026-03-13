import rawChecklist from '../data/checklist.json';

// ─── 런타임 타입 ──────────────────────────────────────────────────────────────
// UI 상태를 포함한 전체 점검 항목 (photo/preview 는 브라우저에서만 존재)

export interface PhotoSlot {
  id:      string;
  label:   string;
  photo:   File | null;
  preview: string | null;
}

export interface InspectionItem {
  id:        string;
  no:        number;
  titleKo:   string;
  titleEn:   string;
  slots:     PhotoSlot[];
  remark?:   string;
  isOpen:    boolean;
  showGuide: boolean;
}

// ─── JSON 데이터 타입 (checklist.json 과 1:1 대응) ────────────────────────────
// guideline 이 없는 항목도 허용 (optional)

interface ChecklistEntry {
  id:        string;
  no:        number;
  titleKo:   string;
  titleEn:   string;
  slots:     string[];
  guideline?: string;
}

// ─── JSON → InspectionItem 변환 ───────────────────────────────────────────────
// · slots 배열의 문자열 라벨 → PhotoSlot[] (photo/preview null 초기화)
// · guideline → remark (없으면 undefined)
// · isOpen / showGuide 는 항상 false 로 초기화

function toInspectionItem(entry: ChecklistEntry): InspectionItem {
  return {
    id:        entry.id,
    no:        entry.no,
    titleKo:   entry.titleKo,
    titleEn:   entry.titleEn,
    slots:     entry.slots.map((label, i) => ({
      id:      `${entry.id}-${i}`,
      label,
      photo:   null,
      preview: null,
    })),
    remark:    entry.guideline,
    isOpen:    false,
    showGuide: false,
  };
}

// ─── 앱 전체에서 사용하는 초기 상태 ──────────────────────────────────────────
export const INITIAL_ITEMS: InspectionItem[] =
  (rawChecklist as ChecklistEntry[]).map(toInspectionItem);
