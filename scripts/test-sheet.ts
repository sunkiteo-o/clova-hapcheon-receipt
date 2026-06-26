/**
 * 시트 연동 검증용 1회성 스크립트.
 * 실행: pnpm tsx scripts/test-sheet.ts
 * 성공 시 콘솔에 행 번호 출력 → 시트에서 해당 행 수동 삭제.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { appendRow } from "../lib/sheets";

async function main() {
  console.log("→ 취사 탭에 더미 행 추가 시도...");
  await appendRow("취사", {
    날짜: "2099-01-01",
    상호: "TEST-삭제요망",
    항목: "연동 검증 더미",
    금액: "0",
  });
  console.log("✓ 성공 — 시트에서 2099-01-01 더미 행 확인 후 삭제하세요.");
}

main().catch((e) => {
  console.error("✗ 실패:", e.message);
  process.exit(1);
});
