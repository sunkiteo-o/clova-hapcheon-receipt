import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";

const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ push: mockPush }),
}));

// Import after mocks
import DonePage from "./page";
import { JANGBU_TABS, JEUNGBING_TABS } from "@/lib/config";

function setupParams(params: Record<string, string | null>) {
  mockGet.mockImplementation((key: string) => params[key] ?? null);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DonePage", () => {
  describe("invalid access (missing params)", () => {
    it("shows 잘못된 접근입니다 when no is missing", () => {
      setupParams({ no: null, tab: "일반", 항목: "답사비", 금액: "5000" });
      render(<DonePage />);
      expect(screen.getByText("잘못된 접근입니다.")).toBeInTheDocument();
    });

    it("shows 잘못된 접근입니다 when tab is missing", () => {
      setupParams({ no: "1", tab: null, 항목: "답사비", 금액: "5000" });
      render(<DonePage />);
      expect(screen.getByText("잘못된 접근입니다.")).toBeInTheDocument();
    });

    it("shows 잘못된 접근입니다 when both no and tab are missing", () => {
      setupParams({ no: null, tab: null });
      render(<DonePage />);
      expect(screen.getByText("잘못된 접근입니다.")).toBeInTheDocument();
    });

    it("does not show 장부 시트 저장 완료 in error state", () => {
      setupParams({ no: null, tab: null });
      render(<DonePage />);
      expect(screen.queryByText(/장부 시트 저장 완료/)).not.toBeInTheDocument();
    });
  });

  describe("success state - 일반 tab", () => {
    beforeEach(() => {
      setupParams({ no: "3", tab: "일반", 항목: "답사비", 금액: "30000" });
    });

    it("renders the 장부 시트 저장 완료 message", () => {
      render(<DonePage />);
      expect(screen.getByText(/장부 시트 저장 완료/)).toBeInTheDocument();
    });

    it("shows the correct JANGBU_TABS label for 일반", () => {
      render(<DonePage />);
      expect(screen.getByText(JANGBU_TABS["일반"])).toBeInTheDocument();
    });

    it("shows No. in the summary card (split text nodes)", () => {
      const { container } = render(<DonePage />);
      // Text like "No.3 · 답사비" is split across nodes; check combined text content
      expect(container.textContent).toContain("No.3");
    });

    it("shows the 항목 in the summary", () => {
      render(<DonePage />);
      expect(screen.getAllByText(/답사비/).length).toBeGreaterThan(0);
    });

    it("formats 금액 with toLocaleString and appends 원", () => {
      const { container } = render(<DonePage />);
      // 30000 formatted → "30,000원" in combined text
      expect(container.textContent).toMatch(/30[,.]?000/);
      expect(container.textContent).toContain("원");
    });

    it("shows the JEUNGBING_TABS label for 일반 (inside brackets)", () => {
      const { container } = render(<DonePage />);
      // Text is rendered as "[하동(일반)_완]" split across nodes; check combined
      expect(container.textContent).toContain(JEUNGBING_TABS["일반"]);
    });

    it("shows the 다음 단계 section", () => {
      render(<DonePage />);
      expect(screen.getByText(/다음 단계/)).toBeInTheDocument();
    });

    it("shows 홈으로 button", () => {
      render(<DonePage />);
      expect(screen.getByRole("button", { name: "홈으로" })).toBeInTheDocument();
    });

    it("clicking 홈으로 navigates to /", () => {
      render(<DonePage />);
      fireEvent.click(screen.getByRole("button", { name: "홈으로" }));
      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("shows 증빙 시트 바로가기 link", () => {
      render(<DonePage />);
      expect(screen.getByText(/증빙 시트 바로가기/)).toBeInTheDocument();
    });

    it("shows 장부 시트에서 확인하기 link", () => {
      render(<DonePage />);
      expect(screen.getByText(/장부 시트에서 확인하기/)).toBeInTheDocument();
    });

    it("shows the no in the 증빙 instruction (split text nodes)", () => {
      const { container } = render(<DonePage />);
      // "No.3 영수증 사진을 첨부해주세요" appears in 증빙 section
      expect(container.textContent).toContain("No.3");
    });
  });

  describe("success state - 취사 tab", () => {
    beforeEach(() => {
      setupParams({ no: "5", tab: "취사", 항목: "", 금액: "15000" });
    });

    it("shows the correct JANGBU_TABS label for 취사", () => {
      render(<DonePage />);
      expect(screen.getByText(JANGBU_TABS["취사"])).toBeInTheDocument();
    });

    it("shows the JEUNGBING_TABS label for 취사 in combined text", () => {
      const { container } = render(<DonePage />);
      expect(container.textContent).toContain(JEUNGBING_TABS["취사"]);
    });

    it("falls back to tab name when 항목 is empty (combined text)", () => {
      const { container } = render(<DonePage />);
      // Summary card: "No.5 · 취사"
      expect(container.textContent).toContain("No.5");
      expect(container.textContent).toContain("취사");
    });

    it("shows formatted 금액", () => {
      const { container } = render(<DonePage />);
      expect(container.textContent).toMatch(/15[,.]?000/);
      expect(container.textContent).toContain("원");
    });
  });

  describe("summary card No. display", () => {
    it("shows the correct no number in combined page text", () => {
      setupParams({ no: "42", tab: "일반", 항목: "식재료", 금액: "8000" });
      const { container } = render(<DonePage />);
      // "No.42" appears in both summary and 증빙 instruction
      expect(container.textContent).toContain("No.42");
    });
  });

  describe("DonePage Suspense wrapper", () => {
    it("renders without crashing (Suspense boundary is present)", () => {
      setupParams({ no: "1", tab: "일반", 항목: "항목", 금액: "1000" });
      expect(() => render(<DonePage />)).not.toThrow();
    });

    it("does not render 잘못된 접근 with valid params", () => {
      setupParams({ no: "1", tab: "일반", 항목: "항목", 금액: "1000" });
      render(<DonePage />);
      expect(screen.queryByText("잘못된 접근입니다.")).not.toBeInTheDocument();
    });
  });
});