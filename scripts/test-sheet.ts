/**
 * 시트 연동 검증용 1회성 스크립트.
 * 실행: pnpm tsx scripts/test-sheet.ts
 * 성공 시 콘솔에 No. 출력 → 시트에서 해당 행 수동 삭제.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { saveRecord } from "../lib/sheets";

async function main() {
  console.log("→ 일반 탭에 더미 행 추가 시도...");
  const result = await saveRecord(
    "하동",
    "일반",
    {
      지출일자: "2099-01-01",
      항목: "답사비",
      금액: 30000,
      비고: "TEST-삭제요망",
    },
  );
  console.log(`✓ 성공 — No.${result.no} 기록됨. 시트에서 해당 행 확인 후 삭제하세요.`);
}

main().catch((e) => {
  console.error("✗ 실패:", e.message);
  process.exit(1);
});
