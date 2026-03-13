// ─────────────────────────────────────────────────────────────────────────────
// Deficiency List – 데이터 매핑 및 정렬 유틸리티
//
// • SECTION_CATEGORY_MAP  : 섹션명 → 8개 대분류 매핑 (UI 표시용 원본 키)
// • SECTION_NO_CATEGORY_MAP: 섹션 번호 → 대분류 (신뢰성 높은 숫자 기반 조회)
// • CATEGORY_ORDER        : 보고서 출력 순서
// • buildDeficiencyList() : 사진 + 코멘트 있는 항목만 필터링 → 정렬 → 번호 부여
// ─────────────────────────────────────────────────────────────────────────────

// ─── 섹션명 → 대분류 매핑 (사용자 제공 원본 데이터) ──────────────────────────
export const SECTION_CATEGORY_MAP: Record<string, string> = {
  "1 Gangway":                      "갑판 관련 구역",
  "2 Certificate and Etc.":         "서류(Deck, Eng) 및 증서(Deck, Eng)",
  "3 Document(Deck)":               "서류(Deck, Eng) 및 증서(Deck, Eng)",
  "4 Bridge":                       "브릿지",
  "5 Outside of Accomodation":      "거주구역 외부",
  "6 Galley":                       "거주구역 내부",
  "7 Living Quarter":               "거주구역 내부",
  "8 Emergency Equipment":          "거주구역 외부",
  "9 Boat Deck":                    "거주구역 외부",
  "10 Main Deck":                   "갑판 관련 구역",
  "11 F'cle Deck":                  "갑판 관련 구역",
  "12 BSN Store and Bow Room":      "창고",
  "13 Cargo Space":                 "화물구역",
  "14 Poop Deck":                   "갑판 관련 구역",
  "15 S/G RM, Workshop, Store":     "창고",
  "16 Document(Engine, ECR)":       "서류(Deck, Eng) 및 증서(Deck, Eng)",
  "17 Engine Room(General)":        "기관구역",
  "18 Engine Room(M/E)":            "기관구역",
  "19 Engine Room(G/E)":            "기관구역",
  "20 Engine Room(Aux Machinery)":  "기관구역",
  "21 Purifier Room":               "기관구역",
  "22 Engine Room(Floor)":          "기관구역",
};

// ─── 보고서 출력 순서 ──────────────────────────────────────────────────────────
export const CATEGORY_ORDER = [
  "서류(Deck, Eng) 및 증서(Deck, Eng)",
  "브릿지",
  "거주구역 외부",
  "화물구역",
  "갑판 관련 구역",
  "거주구역 내부",
  "창고",
  "기관구역",
] as const;

// ─── 섹션 번호 → 대분류 (문자열 불일치 없이 안전하게 조회) ─────────────────────
export const SECTION_NO_CATEGORY_MAP: Record<number, string> = {
  1:  "갑판 관련 구역",
  2:  "서류(Deck, Eng) 및 증서(Deck, Eng)",
  3:  "서류(Deck, Eng) 및 증서(Deck, Eng)",
  4:  "브릿지",
  5:  "거주구역 외부",
  6:  "거주구역 내부",
  7:  "거주구역 내부",
  8:  "거주구역 외부",
  9:  "거주구역 외부",
  10: "갑판 관련 구역",
  11: "갑판 관련 구역",
  12: "창고",
  13: "화물구역",
  14: "갑판 관련 구역",
  15: "창고",
  16: "서류(Deck, Eng) 및 증서(Deck, Eng)",
  17: "기관구역",
  18: "기관구역",
  19: "기관구역",
  20: "기관구역",
  21: "기관구역",
  22: "기관구역",
};

// ─── Deficiency 항목 타입 ─────────────────────────────────────────────────────
export type DeficiencyItem = {
  no:          number;   // 보고서 일련번호 (1, 2, 3…)
  category:    string;   // 대분류 (Korean)
  sectionNo:   number;   // 원래 섹션 번호
  sectionName: string;   // 영문 섹션명 (e.g. "Bridge")
  itemNo:      string;   // 항목 번호 (e.g. "4.8")
  description: string;   // 항목 설명
  photo:       string;   // base64 data URL
  comments:    string;   // 점검관 코멘트 (trimmed)
};

// ─── 내부 타입 ────────────────────────────────────────────────────────────────
type ItemData = {
  id:          string;
  itemNo:      string;
  description: string;
  riskScore:   number;
};

type SectionData = {
  id:      string;
  no:      number;
  nameEn:  string;
  items:   ItemData[];
};

type ResultEntry = {
  photo:    string | null;
  comments: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// buildDeficiencyList
//
// 필터 조건: photo !== null  AND  comments.trim() !== ''
// 정렬 순서: CATEGORY_ORDER → sectionNo → itemNo (숫자 기반)
// ─────────────────────────────────────────────────────────────────────────────
export function buildDeficiencyList(
  sections: SectionData[],
  results:  Record<string, ResultEntry>,
): DeficiencyItem[] {
  const raw: Omit<DeficiencyItem, 'no'>[] = [];

  for (const section of sections) {
    const category = SECTION_NO_CATEGORY_MAP[section.no] ?? '기타';

    for (const item of section.items) {
      const result = results[item.id];
      // 사진 + 코멘트 둘 다 있는 항목만 포함
      if (!result?.photo || !result.comments.trim()) continue;

      raw.push({
        category,
        sectionNo:   section.no,
        sectionName: section.nameEn,
        itemNo:      item.itemNo,
        description: item.description,
        photo:       result.photo,
        comments:    result.comments.trim(),
      });
    }
  }

  // 정렬: 대분류 순서 → 섹션 번호 → 항목 번호 (숫자 기반)
  raw.sort((a, b) => {
    const catA = CATEGORY_ORDER.indexOf(a.category as typeof CATEGORY_ORDER[number]);
    const catB = CATEGORY_ORDER.indexOf(b.category as typeof CATEGORY_ORDER[number]);
    if (catA !== catB) return catA - catB;
    if (a.sectionNo !== b.sectionNo) return a.sectionNo - b.sectionNo;

    // "1.10" > "1.9" 처럼 숫자 기반 정렬
    const [aMain, aSub = '0'] = a.itemNo.split('.');
    const [bMain, bSub = '0'] = b.itemNo.split('.');
    const mainDiff = parseInt(aMain, 10) - parseInt(bMain, 10);
    if (mainDiff !== 0) return mainDiff;
    return parseInt(aSub, 10) - parseInt(bSub, 10);
  });

  // 보고서 일련번호 부여
  return raw.map((item, i) => ({ ...item, no: i + 1 }));
}

// ─── 대분류별 집계 헬퍼 ──────────────────────────────────────────────────────
export function groupByCategory(
  deficiencies: DeficiencyItem[],
): { category: string; items: DeficiencyItem[] }[] {
  const map = new Map<string, DeficiencyItem[]>();

  for (const item of deficiencies) {
    if (!map.has(item.category)) map.set(item.category, []);
    map.get(item.category)!.push(item);
  }

  // CATEGORY_ORDER 순서로 정렬
  return CATEGORY_ORDER
    .map((cat) => ({ category: cat, items: map.get(cat) ?? [] }))
    .filter((g) => g.items.length > 0);
}
