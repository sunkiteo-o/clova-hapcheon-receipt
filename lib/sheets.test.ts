import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the gapi module before importing sheets
vi.mock("./gapi", () => ({
  getToken: vi.fn(),
  sheetsGetValues: vi.fn(),
  sheetsUpdateValues: vi.fn(),
  sheetsBatchUpdateValues: vi.fn(),
  sheetsBatchUpdateRequests: vi.fn(),
  sheetsGetMeta: vi.fn(),
}));

import {
  getItemList,
  saveRecord,
} from "./sheets";
import {
  getToken,
  sheetsGetValues,
  sheetsUpdateValues,
  sheetsBatchUpdateValues,
  sheetsBatchUpdateRequests,
  sheetsGetMeta,
} from "./gapi";

const mockGetToken = vi.mocked(getToken);
const mockSheetsGetValues = vi.mocked(sheetsGetValues);
const mockSheetsUpdateValues = vi.mocked(sheetsUpdateValues);
const mockSheetsBatchUpdateValues = vi.mocked(sheetsBatchUpdateValues);
const mockSheetsBatchUpdateRequests = vi.mocked(sheetsBatchUpdateRequests);
const mockSheetsGetMeta = vi.mocked(sheetsGetMeta);

const MOCK_TOKEN = "test-token";
const MOCK_JANGBU_ID = "jangbu-sheet-id";
const MOCK_JEUNGBING_ID = "jeungbing-sheet-id";

function setupEnv() {
  process.env.SHEET_ID_JANGBU = MOCK_JANGBU_ID;
  process.env.SHEET_ID_JEUNGBING = MOCK_JEUNGBING_ID;
}

function makeDefaultMeta() {
  return {
    sheetId: 10,
    rowCount: 100,
    columnCount: 30,
    merges: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setupEnv();
  mockGetToken.mockResolvedValue(MOCK_TOKEN);
  mockSheetsUpdateValues.mockResolvedValue(undefined);
  mockSheetsBatchUpdateValues.mockResolvedValue(undefined);
  mockSheetsBatchUpdateRequests.mockResolvedValue(undefined);
  mockSheetsGetMeta.mockResolvedValue(makeDefaultMeta());
});

// ── getItemList ──────────────────────────────────────────────────────────────

describe("getItemList", () => {
  it("returns non-empty strings from sheet column", async () => {
    mockSheetsGetValues.mockResolvedValue([["항목1"], ["항목2"], ["항목3"]]);
    const result = await getItemList("하동");
    expect(result).toEqual(["항목1", "항목2", "항목3"]);
  });

  it("filters out empty strings", async () => {
    mockSheetsGetValues.mockResolvedValue([["항목A"], [""], ["항목B"], []]);
    const result = await getItemList("하동");
    expect(result).toEqual(["항목A", "항목B"]);
  });

  it("returns empty array when all rows are empty", async () => {
    mockSheetsGetValues.mockResolvedValue([[""], [], [""]]);
    const result = await getItemList("합천");
    expect(result).toEqual([]);
  });

  it("returns empty array when sheetsGetValues returns no rows", async () => {
    mockSheetsGetValues.mockResolvedValue([]);
    const result = await getItemList("하동");
    expect(result).toEqual([]);
  });

  it("throws when SHEET_ID_JANGBU env var is missing", async () => {
    delete process.env.SHEET_ID_JANGBU;
    await expect(getItemList("하동")).rejects.toThrow("SHEET_ID_JANGBU 환경변수 누락");
  });

  it("calls sheetsGetValues with B column range for 하동", async () => {
    mockSheetsGetValues.mockResolvedValue([]);
    await getItemList("하동");
    expect(mockSheetsGetValues).toHaveBeenCalledWith(
      MOCK_TOKEN,
      MOCK_JANGBU_ID,
      expect.stringContaining("B3:B"),
    );
  });

  it("calls sheetsGetValues with C column range for 합천", async () => {
    mockSheetsGetValues.mockResolvedValue([]);
    await getItemList("합천");
    expect(mockSheetsGetValues).toHaveBeenCalledWith(
      MOCK_TOKEN,
      MOCK_JANGBU_ID,
      expect.stringContaining("C3:C"),
    );
  });

  it("calls sheetsGetValues with D column range for 영동", async () => {
    mockSheetsGetValues.mockResolvedValue([]);
    await getItemList("영동");
    expect(mockSheetsGetValues).toHaveBeenCalledWith(
      MOCK_TOKEN,
      MOCK_JANGBU_ID,
      expect.stringContaining("D3:D"),
    );
  });

  it("calls getToken", async () => {
    mockSheetsGetValues.mockResolvedValue([]);
    await getItemList("하동");
    expect(mockGetToken).toHaveBeenCalledTimes(1);
  });

  it("preserves whitespace/special chars in item names (no trimming)", async () => {
    mockSheetsGetValues.mockResolvedValue([["답사비(교통비)"], [" 식재료 "]]);
    const result = await getItemList("하동");
    expect(result).toEqual(["답사비(교통비)", " 식재료 "]);
  });
});

// ── saveRecord ──────────────────────────────────────────────────────────────

describe("saveRecord - 일반 category", () => {
  const 일반Data = {
    지출일자: "2025-06-15",
    항목: "답사비",
    금액: 30000,
    비고: "TEST",
  };

  beforeEach(() => {
    // No existing rows → first entry, no = 1
    mockSheetsGetValues.mockResolvedValue([]);
  });

  it("returns no=1 when sheet is empty", async () => {
    const result = await saveRecord("하동", "일반", 일반Data);
    expect(result.no).toBe(1);
  });

  it("calls sheetsUpdateValues with correct data including DEFAULT_STATUS", async () => {
    await saveRecord("하동", "일반", 일반Data);
    expect(mockSheetsUpdateValues).toHaveBeenCalledWith(
      MOCK_TOKEN,
      MOCK_JANGBU_ID,
      expect.stringContaining("F"),   // writeStart for 일반 is F
      expect.arrayContaining([
        expect.arrayContaining([1, "2025-06-15", "답사비", 30000, "TEST", "대기"]),
      ]),
    );
  });

  it("uses 대기 as status", async () => {
    await saveRecord("하동", "일반", 일반Data);
    const call = mockSheetsUpdateValues.mock.calls[0];
    const values = call[3] as unknown[][];
    expect(values[0]).toContain("대기");
  });

  it("calls sheetsGetMeta for the jeungbing sheet", async () => {
    await saveRecord("하동", "일반", 일반Data);
    expect(mockSheetsGetMeta).toHaveBeenCalledWith(
      MOCK_TOKEN,
      MOCK_JEUNGBING_ID,
      expect.any(String),
    );
  });

  it("calls sheetsBatchUpdateValues for jeungbing", async () => {
    await saveRecord("하동", "일반", 일반Data);
    expect(mockSheetsBatchUpdateValues).toHaveBeenCalled();
  });

  it("uses correct jangbu tab name (region(category))", async () => {
    await saveRecord("합천", "일반", 일반Data);
    expect(mockSheetsUpdateValues).toHaveBeenCalledWith(
      MOCK_TOKEN,
      MOCK_JANGBU_ID,
      expect.stringContaining("합천(일반)"),
      expect.anything(),
    );
  });

  it("uses correct jeungbing tab name (region(category))", async () => {
    await saveRecord("영동", "일반", 일반Data);
    expect(mockSheetsGetMeta).toHaveBeenCalledWith(
      MOCK_TOKEN,
      MOCK_JEUNGBING_ID,
      "영동(일반)",
    );
  });
});

describe("saveRecord - 취사 category", () => {
  const 취사Data = {
    지출일자: "2025-06-20",
    금액: 15000,
    비고: "취사 테스트",
  };

  beforeEach(() => {
    mockSheetsGetValues.mockResolvedValue([]);
  });

  it("returns no=1 when sheet is empty", async () => {
    const result = await saveRecord("하동", "취사", 취사Data);
    expect(result.no).toBe(1);
  });

  it("writes values without 항목 column for 취사", async () => {
    await saveRecord("하동", "취사", 취사Data);
    expect(mockSheetsUpdateValues).toHaveBeenCalledWith(
      MOCK_TOKEN,
      MOCK_JANGBU_ID,
      expect.stringContaining("H"),   // writeStart for 취사 is H
      expect.arrayContaining([
        expect.arrayContaining([1, "2025-06-20", 15000, "취사 테스트", "대기"]),
      ]),
    );
  });

  it("jeungbing uses 취사비 when 항목 is undefined", async () => {
    await saveRecord("하동", "취사", 취사Data);
    // sheetsBatchUpdateValues should be called with 취사비 as item name
    const batchCalls = mockSheetsBatchUpdateValues.mock.calls;
    expect(batchCalls.length).toBeGreaterThan(0);
    const allRanges = batchCalls.flatMap((call) => call[2]);
    const hasChwisabi = allRanges.some((entry) =>
      JSON.stringify(entry.values).includes("취사비"),
    );
    expect(hasChwisabi).toBe(true);
  });
});

describe("saveRecord - no calculation", () => {
  it("calculates next no as max existing + 1", async () => {
    // Simulate existing rows with dates in index [1] and nos in index [0]
    mockSheetsGetValues.mockResolvedValue([
      ["1", "2025-01-01"],
      ["2", "2025-01-02"],
      ["3", "2025-01-03"],
    ]);
    const result = await saveRecord("하동", "일반", {
      지출일자: "2025-01-04",
      항목: "식재료",
      금액: 5000,
      비고: "",
    });
    expect(result.no).toBe(4);
  });

  it("assigns no=1 when there are no real rows (all empty dates)", async () => {
    mockSheetsGetValues.mockResolvedValue([
      ["1", ""],
      ["2", ""],
    ]);
    const result = await saveRecord("하동", "일반", {
      지출일자: "2025-01-01",
      항목: "항목A",
      금액: 1000,
      비고: "",
    });
    expect(result.no).toBe(1);
  });

  it("handles non-sequential nos by using max", async () => {
    mockSheetsGetValues.mockResolvedValue([
      ["5", "2025-01-01"],
      ["10", "2025-01-02"],
      ["3", "2025-01-03"],
    ]);
    const result = await saveRecord("하동", "일반", {
      지출일자: "2025-01-04",
      항목: "항목",
      금액: 1000,
      비고: "",
    });
    expect(result.no).toBe(11);
  });
});

describe("saveRecord - error cases", () => {
  it("throws when SHEET_ID_JANGBU is missing", async () => {
    delete process.env.SHEET_ID_JANGBU;
    await expect(
      saveRecord("하동", "일반", { 지출일자: "2025-01-01", 항목: "항목", 금액: 1000, 비고: "" }),
    ).rejects.toThrow("SHEET_ID_JANGBU 환경변수 누락");
  });

  it("throws when SHEET_ID_JEUNGBING is missing", async () => {
    delete process.env.SHEET_ID_JEUNGBING;
    mockSheetsGetValues.mockResolvedValue([]);
    await expect(
      saveRecord("하동", "일반", { 지출일자: "2025-01-01", 항목: "항목", 금액: 1000, 비고: "" }),
    ).rejects.toThrow("SHEET_ID_JEUNGBING 환경변수 누락");
  });

  it("throws with informative message when sheet is full (writeRow > max)", async () => {
    // JANGBU_DATA_START_ROW=3, JANGBU_DATA_MAX_ROW=134 → max data rows = 132
    const rows: string[][] = Array.from({ length: 132 }, (_, i) => [
      String(i + 1),
      `2025-01-${String(i + 1).padStart(2, "0")}`,
    ]);
    mockSheetsGetValues.mockResolvedValue(rows);
    await expect(
      saveRecord("하동", "일반", { 지출일자: "2025-06-01", 항목: "항목", 금액: 1000, 비고: "" }),
    ).rejects.toThrow("장부 시트가 꽉 찼습니다");
  });

  it("wraps jeungbing failure with informative error message", async () => {
    mockSheetsGetValues.mockResolvedValue([]);
    mockSheetsGetMeta.mockRejectedValue(new Error("네트워크 오류"));
    await expect(
      saveRecord("하동", "일반", { 지출일자: "2025-01-01", 항목: "항목", 금액: 1000, 비고: "" }),
    ).rejects.toThrow("장부 기록 완료");
  });

  it("wraps non-Error jeungbing failure as string", async () => {
    mockSheetsGetValues.mockResolvedValue([]);
    mockSheetsGetMeta.mockRejectedValue("plain string error");
    await expect(
      saveRecord("하동", "일반", { 지출일자: "2025-01-01", 항목: "항목", 금액: 1000, 비고: "" }),
    ).rejects.toThrow("plain string error");
  });
});

describe("saveRecord - jeungbing block position", () => {
  async function captureJeungbingRanges(no: number) {
    // Simulate existing (no - 1) rows in jangbu
    const rows = Array.from({ length: no - 1 }, (_, i) => [String(i + 1), `2025-01-01`]);
    mockSheetsGetValues.mockResolvedValue(rows);

    await saveRecord("하동", "일반", { 지출일자: "2025-01-01", 항목: "항목", 금액: 1000, 비고: "" });
    return mockSheetsBatchUpdateValues.mock.calls.flatMap((c) => c[2]).map((e) => e.range);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    setupEnv();
    mockGetToken.mockResolvedValue(MOCK_TOKEN);
    mockSheetsUpdateValues.mockResolvedValue(undefined);
    mockSheetsBatchUpdateValues.mockResolvedValue(undefined);
    mockSheetsBatchUpdateRequests.mockResolvedValue(undefined);
    mockSheetsGetMeta.mockResolvedValue(makeDefaultMeta());
  });

  it("no=1 goes into block 0 (first column group)", async () => {
    const ranges = await captureJeungbingRanges(1);
    expect(ranges.some((r) => r.includes("A"))).toBe(true);
  });

  it("no=6 starts a new block group (second pair of rows)", async () => {
    // blockGroup=1, rowStart=1+1*3=4 (0-indexed) → a1 row = rowStart+1 = 5
    const ranges = await captureJeungbingRanges(6);
    expect(ranges.some((r) => r.includes("A5"))).toBe(true);
  });
});
