import { describe, it, expect } from "vitest";
import {
  TAB_TYPES,
  HEADERS,
  DEFAULT_STATUS,
  JANGBU_TABS,
  JEUNGBING_TABS,
  JANGBU_DATA_START_ROW,
  JANGBU_DATA_MAX_ROW,
  JANGBU_LAYOUT,
  isValidTabType,
} from "./config";

describe("TAB_TYPES", () => {
  it("contains exactly 일반 and 취사", () => {
    expect(TAB_TYPES).toContain("일반");
    expect(TAB_TYPES).toContain("취사");
    expect(TAB_TYPES).toHaveLength(2);
  });
});

describe("HEADERS", () => {
  it("includes all required column headers", () => {
    expect(HEADERS).toContain("No.");
    expect(HEADERS).toContain("지출일자");
    expect(HEADERS).toContain("항목");
    expect(HEADERS).toContain("금액");
    expect(HEADERS).toContain("비고");
    expect(HEADERS).toContain("상태");
  });
});

describe("DEFAULT_STATUS", () => {
  it("equals 대기", () => {
    expect(DEFAULT_STATUS).toBe("대기");
  });
});

describe("JANGBU_TABS", () => {
  it("has entries for both tab types", () => {
    expect(JANGBU_TABS["일반"]).toBeTruthy();
    expect(JANGBU_TABS["취사"]).toBeTruthy();
  });

  it("일반 tab maps to expected sheet name", () => {
    expect(JANGBU_TABS["일반"]).toContain("일반");
  });

  it("취사 tab maps to expected sheet name", () => {
    expect(JANGBU_TABS["취사"]).toContain("취사");
  });
});

describe("JEUNGBING_TABS", () => {
  it("has entries for both tab types", () => {
    expect(JEUNGBING_TABS["일반"]).toBeTruthy();
    expect(JEUNGBING_TABS["취사"]).toBeTruthy();
  });

  it("일반 tab maps to expected jeungbing sheet name", () => {
    expect(JEUNGBING_TABS["일반"]).toContain("일반");
  });

  it("취사 tab maps to expected jeungbing sheet name", () => {
    expect(JEUNGBING_TABS["취사"]).toContain("취사");
  });
});

describe("JANGBU_DATA_START_ROW", () => {
  it("is 3 (1-indexed)", () => {
    expect(JANGBU_DATA_START_ROW).toBe(3);
  });
});

describe("JANGBU_DATA_MAX_ROW", () => {
  it("is greater than JANGBU_DATA_START_ROW", () => {
    expect(JANGBU_DATA_MAX_ROW).toBeGreaterThan(JANGBU_DATA_START_ROW);
  });

  it("is 134", () => {
    expect(JANGBU_DATA_MAX_ROW).toBe(134);
  });
});

describe("JANGBU_LAYOUT", () => {
  it("일반 layout has correct column letters", () => {
    const layout = JANGBU_LAYOUT["일반"];
    expect(layout.noCol).toBe("F");
    expect(layout.dateCol).toBe("G");
    expect(layout.writeStart).toBe("F");
    expect(layout.writeEnd).toBe("K");
  });

  it("취사 layout has correct column letters", () => {
    const layout = JANGBU_LAYOUT["취사"];
    expect(layout.noCol).toBe("H");
    expect(layout.dateCol).toBe("I");
    expect(layout.writeStart).toBe("H");
    expect(layout.writeEnd).toBe("L");
  });

  it("writeStart comes before or at writeEnd alphabetically for 일반", () => {
    const { writeStart, writeEnd } = JANGBU_LAYOUT["일반"];
    expect(writeStart.charCodeAt(0)).toBeLessThanOrEqual(writeEnd.charCodeAt(0));
  });

  it("writeStart comes before or at writeEnd alphabetically for 취사", () => {
    const { writeStart, writeEnd } = JANGBU_LAYOUT["취사"];
    expect(writeStart.charCodeAt(0)).toBeLessThanOrEqual(writeEnd.charCodeAt(0));
  });
});

describe("isValidTabType", () => {
  it("returns true for 일반", () => {
    expect(isValidTabType("일반")).toBe(true);
  });

  it("returns true for 취사", () => {
    expect(isValidTabType("취사")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(isValidTabType("")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isValidTabType(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidTabType(undefined)).toBe(false);
  });

  it("returns false for an arbitrary string", () => {
    expect(isValidTabType("취사팀")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isValidTabType(42)).toBe(false);
  });

  it("returns false for an object", () => {
    expect(isValidTabType({})).toBe(false);
  });

  it("returns false for boolean true", () => {
    expect(isValidTabType(true)).toBe(false);
  });

  it("acts as a type guard (both valid values)", () => {
    for (const tab of TAB_TYPES) {
      expect(isValidTabType(tab)).toBe(true);
    }
  });
});