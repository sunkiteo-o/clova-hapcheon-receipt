/**
 * Blob 업로드 → 증빙 시트 이미지 삽입 검증.
 * 실행: pnpm tsx scripts/test-blob-image.ts
 * 성공 후 시트에서 해당 셀 수동 삭제.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { put } from "@vercel/blob";
import { getToken, sheetsBatchUpdateValues } from "../lib/gapi";

const JEUNGBING_ID = process.env.SHEET_ID_JEUNGBING!;
const TAB = "하동(일반)_완";

// 테스트용 1x1 투명 PNG (base64)
const DUMMY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function main() {
  // 1. Blob에 더미 이미지 업로드
  console.log("→ Blob 업로드 중...");
  const buf = Buffer.from(DUMMY_PNG_B64, "base64");
  const blob = await put("test/receipt-test.png", buf, {
    access: "public",
    contentType: "image/png",
  });
  console.log(`✓ Blob URL: ${blob.url}`);

  // 2. 증빙 시트 A2 셀에 =IMAGE() 수식 기록
  console.log("→ 시트에 IMAGE 수식 기록 중...");
  const token = await getToken();
  const formula = `=IMAGE("${blob.url}", 1)`;
  await sheetsBatchUpdateValues(token, JEUNGBING_ID, [
    { range: `'${TAB}'!A2`, values: [[formula]] },
  ]);
  console.log(`✓ 완료. 수식: ${formula}`);
  console.log("→ 시트 A2 셀에서 이미지 보이는지 확인 후 셀 내용 삭제하세요.");
}

main().catch((e) => {
  console.error("✗ 실패:", e.message);
  process.exit(1);
});
