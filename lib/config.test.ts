import { describe, it, expect } from "vitest";
import {
  CATEGORIES,
  REGIONS,
  HEADERS,
  DEFAULT_STATUS,
  JANGBU_DATA_START_ROW,
  JANGBU_DATA_MAX_ROW,
  JANGBU_LAYOUT,
  ITEM_COL,
  jangbuTab,
  jeungbingTab,
  isValidCategory,
  isValidRegion,
} from "./config";

describe("CATEGORIES", () => {
  it("contains exactly 일반 and 취사", () => {
    expect(CATEGORIES).toContain("일반");
    expect(CATEGORIES).toContain("취사");
    expect(CATEGORIES).toHaveLength(2);
  });
});

describe("REGIONS", () => {
  it("contains 합천, 하동, 영동", () => {
    expect(REGIONS).toContain("합천");
    expect(REGIONS).toContain("하동");
    expect(REGIONS).toContain("영동");
    expect(REGIONS).toHaveLength(3);
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

describe("jangbuTab", () => {
  it("returns region(category) string", () => {
    expect(jangbuTab("하동", "일반")).toBe("하동(일반)");
    expect(jangbuTab("합천", "취사")).toBe("합천(취사)");
    expect(jangbuTab("영동", "일반")).toBe("영동(일반)");
  });

  it("contains region and category in result", () => {
    expect(jangbuTab("하동", "일반")).toContain("하동");
    expect(jangbuTab("하동", "일반")).toContain("일반");
  });
});

describe("jeungbingTab", () => {
  it("returns same region(category) string as jangbuTab", () => {
    expect(jeungbingTab("하동", "일반")).toBe("하동(일반)");
    expect(jeungbingTab("합천", "취사")).toBe("합천(취사)");
    expect(jeungbingTab("영동", "일반")).toBe("영동(일반)");
  });

  it("장부 탭과 이름 동일", () => {
    expect(jeungbingTab("하동", "일반")).toBe(jangbuTab("하동", "일반"));
    expect(jeungbingTab("합천", "취사")).toBe(jangbuTab("합천", "취사"));
  });
});

describe("ITEM_COL", () => {
  it("maps 하동 to B", () => expect(ITEM_COL["하동"]).toBe("B"));
  it("maps 합천 to C", () => expect(ITEM_COL["합천"]).toBe("C"));
  it("maps 영동 to D", () => expect(ITEM_COL["영동"]).toBe("D"));
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

describe("isValidCategory", () => {
  it("returns true for 일반", () => expect(isValidCategory("일반")).toBe(true));
  it("returns true for 취사", () => expect(isValidCategory("취사")).toBe(true));
  it("returns false for empty string", () => expect(isValidCategory("")).toBe(false));
  it("returns false for null", () => expect(isValidCategory(null)).toBe(false));
  it("returns false for undefined", () => expect(isValidCategory(undefined)).toBe(false));
  it("returns false for arbitrary string", () => expect(isValidCategory("취사팀")).toBe(false));
  it("returns false for a number", () => expect(isValidCategory(42)).toBe(false));
  it("returns false for boolean", () => expect(isValidCategory(true)).toBe(false));
  it("acts as type guard for all valid values", () => {
    for (const c of CATEGORIES) {
      expect(isValidCategory(c)).toBe(true);
    }
  });
});

describe("isValidRegion", () => {
  it("returns true for 합천", () => expect(isValidRegion("합천")).toBe(true));
  it("returns true for 하동", () => expect(isValidRegion("하동")).toBe(true));
  it("returns true for 영동", () => expect(isValidRegion("영동")).toBe(true));
  it("returns false for empty string", () => expect(isValidRegion("")).toBe(false));
  it("returns false for null", () => expect(isValidRegion(null)).toBe(false));
  it("returns false for arbitrary string", () => expect(isValidRegion("서울")).toBe(false));
  it("acts as type guard for all valid values", () => {
    for (const r of REGIONS) {
      expect(isValidRegion(r)).toBe(true);
    }
  });
});
