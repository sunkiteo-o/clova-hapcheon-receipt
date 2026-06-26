export const TEAMS = ["취사팀", "찬양팀", "교육팀", "진행팀", "기타"] as const;
export type Team = (typeof TEAMS)[number];

export const HEADERS = ["날짜", "팀", "상호", "항목", "금액", "상태", "입력시간"] as const;

export const DEFAULT_STATUS = "대기";

export function tabNameForTeam(team: Team): string {
  return team === "취사팀"
    ? process.env.TAB_CHWISA ?? "취사"
    : process.env.TAB_COMMON ?? "통합";
}

export function isValidTeam(value: unknown): value is Team {
  return TEAMS.includes(value as Team);
}
