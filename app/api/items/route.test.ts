import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/sheets", () => ({
  getItemList: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getRegionFromCookies: vi.fn(),
}));

import { GET } from "./route";
import { getItemList } from "@/lib/sheets";
import { getRegionFromCookies } from "@/lib/auth";

const mockGetItemList = vi.mocked(getItemList);
const mockGetRegion = vi.mocked(getRegionFromCookies);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetRegion.mockResolvedValue("하동");
});

describe("GET /api/items", () => {
  describe("auth", () => {
    it("returns 401 when region cookie is missing", async () => {
      mockGetRegion.mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });
  });

  describe("success cases", () => {
    it("returns 200 with items array for 하동", async () => {
      mockGetRegion.mockResolvedValue("하동");
      mockGetItemList.mockResolvedValue(["항목A", "항목B"]);
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual(["항목A", "항목B"]);
    });

    it("returns 200 with items array for 합천", async () => {
      mockGetRegion.mockResolvedValue("합천");
      mockGetItemList.mockResolvedValue(["합천항목1"]);
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual(["합천항목1"]);
    });

    it("returns 200 with items array for 영동", async () => {
      mockGetRegion.mockResolvedValue("영동");
      mockGetItemList.mockResolvedValue(["영동항목1"]);
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual(["영동항목1"]);
    });

    it("returns empty items array when getItemList returns empty", async () => {
      mockGetItemList.mockResolvedValue([]);
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
    });

    it("calls getItemList with the region from cookie", async () => {
      mockGetRegion.mockResolvedValue("하동");
      mockGetItemList.mockResolvedValue([]);
      await GET();
      expect(mockGetItemList).toHaveBeenCalledWith("하동");
    });
  });

  describe("error handling", () => {
    it("returns 500 when getItemList throws an Error", async () => {
      mockGetItemList.mockRejectedValue(new Error("Google API 연결 실패"));
      const res = await GET();
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Google API 연결 실패");
    });

    it("returns 500 with generic message when getItemList throws non-Error", async () => {
      mockGetRegion.mockResolvedValue("합천");
      mockGetItemList.mockRejectedValue("unknown error");
      const res = await GET();
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    });

    it("does not expose internal error details beyond message", async () => {
      mockGetItemList.mockRejectedValue(new Error("환경변수 누락"));
      const res = await GET();
      const body = await res.json();
      expect(body.error).toBe("환경변수 누락");
      expect(body.stack).toBeUndefined();
    });
  });
});
