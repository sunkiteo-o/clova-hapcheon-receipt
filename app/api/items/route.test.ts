import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the sheets module
vi.mock("@/lib/sheets", () => ({
  getItemList: vi.fn(),
}));

// Mock the config module (keep actual behaviour but allow spying)
vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return { ...actual };
});

import { GET } from "./route";
import { getItemList } from "@/lib/sheets";

const mockGetItemList = vi.mocked(getItemList);

function makeRequest(region?: string | null): NextRequest {
  const url = new URL(
    region != null ? `http://localhost/api/items?region=${encodeURIComponent(region)}` : "http://localhost/api/items",
  );
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/items", () => {
  describe("validation", () => {
    it("returns 400 when region param is missing", async () => {
      const req = makeRequest(null);
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/region/);
    });

    it("returns 400 when region param is empty string", async () => {
      const req = makeRequest("");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when region is an invalid value", async () => {
      const req = makeRequest("서울");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for arbitrary string region", async () => {
      const req = makeRequest("invalid");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });
  });

  describe("success cases", () => {
    it("returns 200 with items array for 하동", async () => {
      mockGetItemList.mockResolvedValue(["항목A", "항목B"]);
      const req = makeRequest("하동");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual(["항목A", "항목B"]);
    });

    it("returns 200 with items array for 합천", async () => {
      mockGetItemList.mockResolvedValue(["합천항목1"]);
      const req = makeRequest("합천");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual(["합천항목1"]);
    });

    it("returns 200 with items array for 영동", async () => {
      mockGetItemList.mockResolvedValue(["영동항목1"]);
      const req = makeRequest("영동");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual(["영동항목1"]);
    });

    it("returns empty items array when getItemList returns empty", async () => {
      mockGetItemList.mockResolvedValue([]);
      const req = makeRequest("하동");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
    });

    it("calls getItemList with the validated region", async () => {
      mockGetItemList.mockResolvedValue([]);
      const req = makeRequest("하동");
      await GET(req);
      expect(mockGetItemList).toHaveBeenCalledWith("하동");
    });
  });

  describe("error handling", () => {
    it("returns 500 when getItemList throws an Error", async () => {
      mockGetItemList.mockRejectedValue(new Error("Google API 연결 실패"));
      const req = makeRequest("하동");
      const res = await GET(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Google API 연결 실패");
    });

    it("returns 500 with generic message when getItemList throws non-Error", async () => {
      mockGetItemList.mockRejectedValue("unknown error");
      const req = makeRequest("합천");
      const res = await GET(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    });

    it("does not expose internal error details beyond message", async () => {
      mockGetItemList.mockRejectedValue(new Error("환경변수 누락"));
      const req = makeRequest("하동");
      const res = await GET(req);
      const body = await res.json();
      expect(body.error).toBe("환경변수 누락");
      expect(body.stack).toBeUndefined();
    });
  });
});
