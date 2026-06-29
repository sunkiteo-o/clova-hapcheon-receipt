export const TAB_TYPES = ["일반", "취사"] as const;
export type TabType = (typeof TAB_TYPES)[number];

export const REGIONS = ["하동", "합천", "영동"] as const;
export type RegionType = (typeof REGIONS)[number];

// 세부항목 리스트 탭 열 매핑 (B=하동, C=합천, D=영동)
export const ITEMS_COL: Record<RegionType, string> = {
  "하동": "B",
  "합천": "C",
  "영동": "D",
};

export function isValidRegion(v: unknown): v is RegionType {
  return REGIONS.includes(v as RegionType);
}

export const HEADERS = ["No.", "지출일자", "항목", "금액", "비고", "상태"] as const;

export const DEFAULT_STATUS = "대기";

export const JANGBU_TABS: Record<TabType, string> = {
  "일반": "2025 하동 하봉(일반)_완",
  "취사": "2025 하동 하봉(취사)_완",
};

export const JEUNGBING_TABS: Record<TabType, string> = {
  "일반": "하동(일반)_완",
  "취사": "하동(취사)_완",
};

// 장부 데이터 행 범위
export const JANGBU_DATA_START_ROW = 3; // 1-indexed (일반·취사 공통)
export const JANGBU_DATA_MAX_ROW = 134; // 1-indexed

// 탭별 열 매핑
// 일반: F=No. G=지출일자 H=항목 I=금액 J=비고 K=상태
// 취사: H=No. I=지출일자           J=금액 K=비고 L=상태
export const JANGBU_LAYOUT: Record<TabType, {
  noCol: string;
  dateCol: string;
  writeStart: string;
  writeEnd: string;
}> = {
  "일반": { noCol: "F", dateCol: "G", writeStart: "F", writeEnd: "K" },
  "취사": { noCol: "H", dateCol: "I", writeStart: "H", writeEnd: "L" },
};

export function isValidTabType(v: unknown): v is TabType {
  return TAB_TYPES.includes(v as TabType);
}
