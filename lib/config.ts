export const CATEGORIES = ["일반", "취사"] as const;
export type Category = (typeof CATEGORIES)[number];

export const REGIONS = ["합천", "하동", "영동"] as const;
export type Region = (typeof REGIONS)[number];

export function isValidCategory(v: unknown): v is Category {
  return CATEGORIES.includes(v as Category);
}

export function isValidRegion(v: unknown): v is Region {
  return REGIONS.includes(v as Region);
}

export function jangbuTab(region: Region, category: Category): string {
  return `${region}(${category})`;
}

export function jeungbingTab(region: Region, category: Category): string {
  return `${region}(${category})`;
}

export const HEADERS = ["No.", "지출일자", "항목", "금액", "비고", "상태"] as const;

export const DEFAULT_STATUS = "대기";

// 장부 데이터 행 범위
export const JANGBU_DATA_START_ROW = 3; // 1-indexed (일반·취사 공통)
export const JANGBU_DATA_MAX_ROW = 134; // 1-indexed

// 탭별 열 매핑
// 일반: F=No. G=지출일자 H=항목 I=금액 J=비고 K=상태
// 취사: H=No. I=지출일자           J=금액 K=비고 L=상태
export const JANGBU_LAYOUT: Record<Category, {
  noCol: string;
  dateCol: string;
  writeStart: string;
  writeEnd: string;
}> = {
  "일반": { noCol: "F", dateCol: "G", writeStart: "F", writeEnd: "K" },
  "취사": { noCol: "H", dateCol: "I", writeStart: "H", writeEnd: "L" },
};

// 세부항목 리스트 열 매핑 (B=하동, C=합천, D=영동)
export const ITEM_COL: Record<Region, string> = {
  "하동": "B",
  "합천": "C",
  "영동": "D",
};
