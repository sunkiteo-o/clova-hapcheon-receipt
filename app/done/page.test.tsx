import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ push: mockPush }),
}));

// Import after mocks
import DonePage from "./page";

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
  });

  describe("success state - 일반 tab", () => {
    beforeEach(() => {
      setupParams({ no: "3", tab: "일반", 항목: "답사비", 금액: "30000" });
    });

    it("renders 저장 완료 message", () => {
      render(<DonePage />);
      expect(screen.getByText(/저장 완료/)).toBeInTheDocument();
    });

    it("shows No. in the summary card", () => {
      const { container } = render(<DonePage />);
      expect(container.textContent).toContain("No.");
      expect(container.textContent).toContain("3");
    });

    it("shows the 항목 in the summary", () => {
      render(<DonePage />);
      expect(screen.getAllByText(/답사비/).length).toBeGreaterThan(0);
    });

    it("formats 금액 with toLocaleString and appends 원", () => {
      const { container } = render(<DonePage />);
      expect(container.textContent).toMatch(/30[,.]?000/);
      expect(container.textContent).toContain("원");
    });

    it("shows 영수증 또 등록하기 button", () => {
      render(<DonePage />);
      expect(screen.getByRole("button", { name: "영수증 또 등록하기" })).toBeInTheDocument();
    });

    it("clicking 영수증 또 등록하기 navigates to /", () => {
      render(<DonePage />);
      fireEvent.click(screen.getByRole("button", { name: "영수증 또 등록하기" }));
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  describe("success state - 취사 tab", () => {
    beforeEach(() => {
      setupParams({ no: "5", tab: "취사", 항목: "", 금액: "15000" });
    });

    it("shows 취사비 when 항목 is empty for 취사 tab", () => {
      const { container } = render(<DonePage />);
      expect(container.textContent).toContain("취사비");
    });

    it("shows formatted 금액", () => {
      const { container } = render(<DonePage />);
      expect(container.textContent).toMatch(/15[,.]?000/);
      expect(container.textContent).toContain("원");
    });

    it("shows No. 5 in combined text", () => {
      const { container } = render(<DonePage />);
      expect(container.textContent).toContain("5");
    });
  });

  describe("summary card No. display", () => {
    it("shows the correct no number in combined page text", () => {
      setupParams({ no: "42", tab: "일반", 항목: "식재료", 금액: "8000" });
      const { container } = render(<DonePage />);
      expect(container.textContent).toContain("42");
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
