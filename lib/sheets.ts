import {
  getToken,
  sheetsGetValues,
  sheetsUpdateValues,
  sheetsBatchUpdateValues,
  sheetsBatchUpdateRequests,
  sheetsGetMeta,
} from "./gapi";
import {
  TabType,
  RegionType,
  JANGBU_TABS,
  JEUNGBING_TABS,
  DEFAULT_STATUS,
  JANGBU_DATA_START_ROW,
  JANGBU_DATA_MAX_ROW,
  JANGBU_LAYOUT,
  ITEMS_COL,
} from "./config";

// ──────────────────────────────────────────────
// 항목 목록 (세부항목 리스트 탭 B열에서 동적 로드)
// ──────────────────────────────────────────────

const ITEMS_TAB = "회계를 부탁해-세부항목 리스트";

// 1행=공지, 2행=지역헤더(B=하동, C=합천, D=영동), 3행~=항목
export async function getItemList(_tabType: TabType, region: RegionType = "하동"): Promise<string[]> {
  const token = await getToken();
  const sheetId = process.env.SHEET_ID_JANGBU;
  if (!sheetId) throw new Error("SHEET_ID_JANGBU 환경변수 누락");

  const col = ITEMS_COL[region];
  const rows = await sheetsGetValues(token, sheetId, `'${ITEMS_TAB}'!${col}3:${col}`);

  // 빈 셀만 제외. 값 가공 금지 — 공백·괄호 바꾸면 SUMIF 매칭 깨짐.
  return rows.map((r) => r[0] ?? "").filter((v) => v !== "");
}

// ──────────────────────────────────────────────
// 두 시트 동시 기록
// ──────────────────────────────────────────────

export interface RecordData {
  지출일자: string;
  항목?: string;
  금액: number;
  비고: string;
}

export async function saveRecord(
  tabType: TabType,
  data: RecordData,
  imageUrl?: string,
): Promise<{ no: number }> {
  const token = await getToken();

  const jangbuId = process.env.SHEET_ID_JANGBU;
  const jeungbingId = process.env.SHEET_ID_JEUNGBING;
  if (!jangbuId) throw new Error("SHEET_ID_JANGBU 환경변수 누락");
  if (!jeungbingId) throw new Error("SHEET_ID_JEUNGBING 환경변수 누락");

  const jangbuTab = JANGBU_TABS[tabType];
  const jeungbingTab = JEUNGBING_TABS[tabType];

  const layout = JANGBU_LAYOUT[tabType];

  // ── 1. 장부: 다음 No. 계산 ──
  // No.열은 템플릿으로 미리 채워진 경우가 있으므로 지출일자 열로 실제 데이터 행 판별
  const ndRows = await sheetsGetValues(
    token, jangbuId,
    `'${jangbuTab}'!${layout.noCol}${JANGBU_DATA_START_ROW}:${layout.dateCol}${JANGBU_DATA_MAX_ROW}`,
  );

  // 지출일자(index 1)가 채워진 행 = 실제 데이터
  const realRows = ndRows.filter((r) => r[1]?.trim());
  const realNos = realRows.map((r) => parseInt(r[0] ?? "", 10)).filter((n) => !isNaN(n));
  const no = realNos.length > 0 ? Math.max(...realNos) + 1 : 1;

  // 마지막 실제 데이터 행 다음에 기록
  let lastRealIdx = -1;
  for (let i = ndRows.length - 1; i >= 0; i--) {
    if (ndRows[i]?.[1]?.trim()) { lastRealIdx = i; break; }
  }
  const writeRow = JANGBU_DATA_START_ROW + lastRealIdx + 1; // 1-indexed

  if (writeRow > JANGBU_DATA_MAX_ROW) {
    throw new Error(
      `장부 시트가 꽉 찼습니다 (No.${no}, 행${writeRow}). ` +
      `시트의 SUMIF 범위를 확장해 주세요.`,
    );
  }

  // ── 2. 장부 기록 ──
  // 일반: F~K = [No., 지출일자, 항목, 금액, 비고, 상태]
  // 취사: H~L = [No., 지출일자, 금액, 비고, 상태]  (항목 열 없음)
  const writeValues = tabType === "일반"
    ? [no, data.지출일자, data.항목 ?? "", data.금액, data.비고, DEFAULT_STATUS]
    : [no, data.지출일자, data.금액, data.비고, DEFAULT_STATUS];
  await sheetsUpdateValues(
    token,
    jangbuId,
    `'${jangbuTab}'!${layout.writeStart}${writeRow}:${layout.writeEnd}${writeRow}`,
    [writeValues],
  );

  // ── 3. 증빙 기록 ──
  try {
    await writeJeungbing(token, jeungbingId, jeungbingTab, no, data, imageUrl);
  } catch (e) {
    // 장부는 성공, 증빙만 실패 — 부분 실패 메시지 포함해 throw
    throw new Error(
      `장부 기록 완료 (No.${no}), 증빙 기록 실패: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  return { no };
}

// ──────────────────────────────────────────────
// 증빙 시트 블록 기록
// ──────────────────────────────────────────────

async function writeJeungbing(
  token: string,
  spreadsheetId: string,
  tabName: string,
  no: number,
  data: RecordData,
  imageUrl?: string,
) {
  const meta = await sheetsGetMeta(token, spreadsheetId, tabName);
  const numericSheetId = meta.sheetId;

  // 블록 위치 계산
  const blockIndex = (no - 1) % 5;
  const blockGroup = Math.floor((no - 1) / 5);
  const rowStart = 1 + blockGroup * 3; // 0-indexed, row 0 = 제목란(skip), 블록당 3행
  const colBunho = blockIndex * 3;
  const colData1 = blockIndex * 3 + 1;
  const colData2 = blockIndex * 3 + 2;

  // ── 행/열 부족 시 자동 확장 ──
  const requiredRows = rowStart + 3;
  const requiredCols = colData2 + 1;
  const expandRequests: unknown[] = [];
  if (requiredRows > meta.rowCount)
    expandRequests.push({ appendDimension: { sheetId: numericSheetId, dimension: "ROWS", length: requiredRows - meta.rowCount + 12 } });
  if (requiredCols > meta.columnCount)
    expandRequests.push({ appendDimension: { sheetId: numericSheetId, dimension: "COLUMNS", length: requiredCols - meta.columnCount + 3 } });
  if (expandRequests.length > 0)
    await sheetsBatchUpdateRequests(token, spreadsheetId, expandRequests);

  // ── 원하는 병합 범위 정의 ──
  // 블록 구조 (스프레드시트 기준, rowStart=0-indexed):
  //   rowStart+0: [A=번호↕2] B=항목  C=금액
  //   rowStart+1: [A=번호↕2] B:C merged = 비고
  //   rowStart+2: A:C merged = 이미지 (=IMAGE() 수식)
  type GRange = { startRowIndex: number; endRowIndex: number; startColumnIndex: number; endColumnIndex: number };
  const desired: GRange[] = [
    // 번호 세로 병합: A rowStart ~ rowStart+1 (endRowIndex exclusive → rowStart+2)
    { startRowIndex: rowStart, endRowIndex: rowStart + 2, startColumnIndex: colBunho, endColumnIndex: colBunho + 1 },
    // 비고 가로 병합: B:C rowStart+1
    { startRowIndex: rowStart + 1, endRowIndex: rowStart + 2, startColumnIndex: colData1, endColumnIndex: colData2 + 1 },
    // 이미지 가로 병합: A:C rowStart+2
    { startRowIndex: rowStart + 2, endRowIndex: rowStart + 3, startColumnIndex: colBunho, endColumnIndex: colData2 + 1 },
  ];

  const overlaps = (a: GRange, b: GRange) =>
    a.startRowIndex < b.endRowIndex && a.endRowIndex > b.startRowIndex &&
    a.startColumnIndex < b.endColumnIndex && a.endColumnIndex > b.startColumnIndex;

  const equal = (a: GRange, b: GRange) =>
    a.startRowIndex === b.startRowIndex && a.endRowIndex === b.endRowIndex &&
    a.startColumnIndex === b.startColumnIndex && a.endColumnIndex === b.endColumnIndex;

  // 기존 충돌 병합 해제 (부분 겹침 → 먼저 해제해야 새 병합 가능)
  const existing = meta.merges.map(({ startRowIndex, endRowIndex, startColumnIndex, endColumnIndex }) =>
    ({ startRowIndex, endRowIndex, startColumnIndex, endColumnIndex })
  );
  const toUnmerge = existing.filter(e => desired.some(d => overlaps(e, d) && !equal(e, d)));
  if (toUnmerge.length > 0) {
    await sheetsBatchUpdateRequests(token, spreadsheetId,
      toUnmerge.map(r => ({ unmergeCells: { range: { sheetId: numericSheetId, ...r } } }))
    );
  }

  // ── 셀 값 기록 ──
  const imageFormula = imageUrl ? `=IMAGE("${imageUrl}", 1)` : "";
  await sheetsBatchUpdateValues(token, spreadsheetId, [
    { range: a1(tabName, rowStart,     colBunho), values: [[no]] },
    { range: a1(tabName, rowStart,     colData1), values: [[data.항목 || "취사비"]] },
    { range: a1(tabName, rowStart,     colData2), values: [[data.금액]] },
    { range: a1(tabName, rowStart + 1, colData1), values: [[data.비고 || ""]] },
    { range: a1(tabName, rowStart + 2, colBunho), values: [[imageFormula]] },
  ]);

  // ── 병합 적용 + 이미지 셀 중앙 정렬 ──
  const needsMerge = desired.filter(d => !existing.some(e => equal(e, d)));
  const formatRequests: unknown[] = needsMerge.map(r =>
    mergeCells(numericSheetId, r.startRowIndex, r.endRowIndex, r.startColumnIndex, r.endColumnIndex)
  );
  // 이미지 행(rowStart+2) 가로/세로 중앙 정렬
  formatRequests.push({
    repeatCell: {
      range: {
        sheetId: numericSheetId,
        startRowIndex: rowStart + 2,
        endRowIndex: rowStart + 3,
        startColumnIndex: colBunho,
        endColumnIndex: colData2 + 1,
      },
      cell: {
        userEnteredFormat: {
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE",
        },
      },
      fields: "userEnteredFormat(horizontalAlignment,verticalAlignment)",
    },
  });
  if (formatRequests.length > 0) {
    await sheetsBatchUpdateRequests(token, spreadsheetId, formatRequests);
  }
}

// ──────────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────────

function colLetter(col: number): string {
  let result = "";
  let c = col + 1;
  while (c > 0) {
    c--;
    result = String.fromCharCode(65 + (c % 26)) + result;
    c = Math.floor(c / 26);
  }
  return result;
}

function a1(tab: string, row: number, col: number): string {
  return `'${tab}'!${colLetter(col)}${row + 1}`;
}

function mergeCells(
  sheetId: number,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
) {
  return {
    mergeCells: {
      range: { sheetId, startRowIndex: startRow, endRowIndex: endRow, startColumnIndex: startCol, endColumnIndex: endCol },
      mergeType: "MERGE_ALL",
    },
  };
}
