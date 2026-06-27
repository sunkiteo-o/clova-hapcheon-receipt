import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the sheets module
vi.mock("@/lib/sheets", () => ({
  getItemList: vi.fn(),
}));

// Mock the config module (keep isValidTabType behaviour but allow spying)
vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return { ...actual };
});

import { GET } from "./route";
import { getItemList } from "@/lib/sheets";

const mockGetItemList = vi.mocked(getItemList);

function makeRequest(tab?: string | null): NextRequest {
  const url = new URL(
    tab != null ? `http://localhost/api/items?tab=${encodeURIComponent(tab)}` : "http://localhost/api/items",
  );
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/items", () => {
  describe("validation", () => {
    it("returns 400 when tab param is missing", async () => {
      const req = makeRequest(null);
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/tab/);
    });

    it("returns 400 when tab param is empty string", async () => {
      const req = makeRequest("");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when tab is an invalid value", async () => {
      const req = makeRequest("취사팀");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for arbitrary string tab", async () => {
      const req = makeRequest("invalid");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });
  });

  describe("success cases", () => {
    it("returns 200 with items array for 일반 tab", async () => {
      mockGetItemList.mockResolvedValue(["항목A", "항목B"]);
      const req = makeRequest("일반");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual(["항목A", "항목B"]);
    });

    it("returns 200 with items array for 취사 tab", async () => {
      mockGetItemList.mockResolvedValue(["취사항목1"]);
      const req = makeRequest("취사");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual(["취사항목1"]);
    });

    it("returns empty items array when getItemList returns empty", async () => {
      mockGetItemList.mockResolvedValue([]);
      const req = makeRequest("일반");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
    });

    it("calls getItemList with the validated tab type", async () => {
      mockGetItemList.mockResolvedValue([]);
      const req = makeRequest("일반");
      await GET(req);
      expect(mockGetItemList).toHaveBeenCalledWith("일반");
    });
  });

  describe("error handling", () => {
    it("returns 500 when getItemList throws an Error", async () => {
      mockGetItemList.mockRejectedValue(new Error("Google API 연결 실패"));
      const req = makeRequest("일반");
      const res = await GET(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Google API 연결 실패");
    });

    it("returns 500 with generic message when getItemList throws non-Error", async () => {
      mockGetItemList.mockRejectedValue("unknown error");
      const req = makeRequest("취사");
      const res = await GET(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    });

    it("does not expose internal error details beyond message", async () => {
      mockGetItemList.mockRejectedValue(new Error("환경변수 누락"));
      const req = makeRequest("일반");
      const res = await GET(req);
      const body = await res.json();
      expect(body.error).toBe("환경변수 누락");
      expect(body.stack).toBeUndefined();
    });
  });
});