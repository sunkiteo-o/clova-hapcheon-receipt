import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/sheets", () => ({
  saveRecord: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getRegionFromCookies: vi.fn(),
}));

import { POST } from "./route";
import { saveRecord } from "@/lib/sheets";
import { getRegionFromCookies } from "@/lib/auth";

const mockSaveRecord = vi.mocked(saveRecord);
const mockGetRegion = vi.mocked(getRegionFromCookies);

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Default valid body (no region — comes from cookie)
const BASE = { tab: "일반", 지출일자: "2025-06-01", 항목: "답사비", 금액: 5000 };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetRegion.mockResolvedValue("하동");
});

describe("POST /api/save", () => {
  describe("auth", () => {
    it("returns 401 when region cookie is missing", async () => {
      mockGetRegion.mockResolvedValue(null);
      const req = makeRequest(BASE);
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  describe("tab validation", () => {
    it("returns 400 when tab is missing", async () => {
      const req = makeRequest({ 지출일자: "2025-06-01", 항목: "답사비", 금액: 5000 });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/tab/);
    });

    it("returns 400 when tab is invalid string", async () => {
      const req = makeRequest({ ...BASE, tab: "취사팀" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when tab is null", async () => {
      const req = makeRequest({ ...BASE, tab: null });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("required field validation", () => {
    it("returns 400 when 지출일자 is missing", async () => {
      const req = makeRequest({ ...BASE, 지출일자: undefined });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/지출일자/);
    });

    it("returns 400 when 금액 is missing", async () => {
      const req = makeRequest({ tab: "일반", 지출일자: "2025-06-01", 항목: "답사비" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when both 지출일자 and 금액 are missing", async () => {
      const req = makeRequest({ tab: "일반", 항목: "답사비" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("일반 tab 항목 validation", () => {
    it("returns 400 when tab is 일반 and 항목 is missing", async () => {
      const req = makeRequest({ tab: "일반", 지출일자: "2025-06-01", 금액: 5000 });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/항목/);
    });

    it("returns 400 when tab is 일반 and 항목 is empty string", async () => {
      const req = makeRequest({ tab: "일반", 지출일자: "2025-06-01", 금액: 5000, 항목: "" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("does NOT require 항목 for 취사 tab", async () => {
      mockSaveRecord.mockResolvedValue({ no: 1 });
      const req = makeRequest({ tab: "취사", 지출일자: "2025-06-01", 금액: 5000 });
      const res = await POST(req);
      expect(res.status).not.toBe(400);
    });
  });

  describe("date format validation", () => {
    it("returns 400 for date without dashes (YYYYMMDD)", async () => {
      const req = makeRequest({ ...BASE, 지출일자: "20250601" });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/날짜/);
    });

    it("returns 400 for incorrect date format (DD-MM-YYYY)", async () => {
      const req = makeRequest({ ...BASE, 지출일자: "01-06-2025" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for date with extra characters", async () => {
      const req = makeRequest({ ...BASE, 지출일자: "2025/06/01" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("accepts valid YYYY-MM-DD format", async () => {
      mockSaveRecord.mockResolvedValue({ no: 1 });
      const req = makeRequest(BASE);
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  describe("금액 validation", () => {
    it("returns 400 for zero 금액", async () => {
      const req = makeRequest({ ...BASE, 금액: 0 });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/금액/);
    });

    it("strips non-numeric chars (negative sign) from 금액 and accepts the remaining digits", async () => {
      mockSaveRecord.mockResolvedValue({ no: 1 });
      const req = makeRequest({ ...BASE, 금액: -100 });
      const res = await POST(req);
      // -100 stripped to "100" → valid positive integer
      expect(res.status).toBe(200);
      expect(mockSaveRecord).toHaveBeenCalledWith(
        "하동",
        "일반",
        expect.objectContaining({ 금액: 100 }),
        undefined,
      );
    });

    it("returns 400 for non-numeric 금액 string", async () => {
      const req = makeRequest({ ...BASE, 금액: "abc" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("accepts numeric string as 금액 and strips non-numeric chars", async () => {
      mockSaveRecord.mockResolvedValue({ no: 1 });
      const req = makeRequest({ ...BASE, 금액: "15,000" });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockSaveRecord).toHaveBeenCalledWith(
        "하동",
        "일반",
        expect.objectContaining({ 금액: 15000 }),
        undefined,
      );
    });

    it("passes 금액 as integer to saveRecord", async () => {
      mockSaveRecord.mockResolvedValue({ no: 2 });
      const req = makeRequest({ tab: "취사", 지출일자: "2025-06-01", 금액: "5000" });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockSaveRecord).toHaveBeenCalledWith(
        "하동",
        "취사",
        expect.objectContaining({ 금액: 5000 }),
        undefined,
      );
    });
  });

  describe("success responses", () => {
    it("returns { ok: true, no } on success for 일반 — region from cookie", async () => {
      mockGetRegion.mockResolvedValue("합천");
      mockSaveRecord.mockResolvedValue({ no: 7 });
      const req = makeRequest({ tab: "일반", 지출일자: "2025-06-01", 항목: "식재료", 금액: 30000 });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.no).toBe(7);
      expect(mockSaveRecord).toHaveBeenCalledWith("합천", "일반", expect.any(Object), undefined);
    });

    it("returns { ok: true, no } on success for 취사 — region from cookie", async () => {
      mockGetRegion.mockResolvedValue("영동");
      mockSaveRecord.mockResolvedValue({ no: 3 });
      const req = makeRequest({ tab: "취사", 지출일자: "2025-06-05", 금액: 12000, 비고: "메모" });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.no).toBe(3);
      expect(mockSaveRecord).toHaveBeenCalledWith("영동", "취사", expect.any(Object), undefined);
    });

    it("defaults 비고 to empty string when not provided", async () => {
      mockSaveRecord.mockResolvedValue({ no: 1 });
      const req = makeRequest(BASE);
      await POST(req);
      expect(mockSaveRecord).toHaveBeenCalledWith(
        "하동",
        "일반",
        expect.objectContaining({ 비고: "" }),
        undefined,
      );
    });

    it("passes 비고 when provided", async () => {
      mockSaveRecord.mockResolvedValue({ no: 1 });
      const req = makeRequest({ tab: "취사", 지출일자: "2025-06-01", 금액: 5000, 비고: "상호명" });
      await POST(req);
      expect(mockSaveRecord).toHaveBeenCalledWith(
        "하동",
        "취사",
        expect.objectContaining({ 비고: "상호명" }),
        undefined,
      );
    });

    it("body region field is ignored — cookie region wins", async () => {
      mockGetRegion.mockResolvedValue("합천");
      mockSaveRecord.mockResolvedValue({ no: 1 });
      const req = makeRequest({ ...BASE, region: "영동" }); // body claims 영동
      await POST(req);
      expect(mockSaveRecord).toHaveBeenCalledWith("합천", expect.any(String), expect.any(Object), undefined);
    });
  });

  describe("error handling", () => {
    it("returns 500 when saveRecord throws an Error", async () => {
      mockSaveRecord.mockRejectedValue(new Error("시트 연결 실패"));
      const req = makeRequest(BASE);
      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("시트 연결 실패");
    });

    it("returns 500 with generic message when saveRecord throws non-Error", async () => {
      mockSaveRecord.mockRejectedValue("raw failure");
      const req = makeRequest({ tab: "취사", 지출일자: "2025-06-01", 금액: 5000 });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("저장 실패");
    });
  });
});
