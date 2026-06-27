import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoist the mock so it's available in the vi.mock factory
const mockGetAccessToken = vi.hoisted(() => vi.fn());

vi.mock("google-auth-library", () => {
  const MockJWT = vi.fn().mockImplementation(function (
    this: { getAccessToken: typeof mockGetAccessToken },
  ) {
    this.getAccessToken = mockGetAccessToken;
  });
  return { JWT: MockJWT };
});

import {
  makeAuth,
  getToken,
  sheetsGetValues,
  sheetsUpdateValues,
  sheetsBatchUpdateValues,
  sheetsBatchUpdateRequests,
  sheetsGetMeta,
} from "./gapi";
import { JWT } from "google-auth-library";

const MockJWTClass = JWT as unknown as ReturnType<typeof vi.fn>;

function makeFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe("makeAuth", () => {
  const ORIG_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const ORIG_KEY = process.env.GOOGLE_PRIVATE_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = ORIG_EMAIL;
    process.env.GOOGLE_PRIVATE_KEY = ORIG_KEY;
  });

  it("throws when email env var is missing", () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    process.env.GOOGLE_PRIVATE_KEY = "key";
    expect(() => makeAuth()).toThrow("Google 서비스 계정 환경변수 누락");
  });

  it("throws when key env var is missing", () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "test@test.com";
    delete process.env.GOOGLE_PRIVATE_KEY;
    expect(() => makeAuth()).toThrow("Google 서비스 계정 환경변수 누락");
  });

  it("throws when both env vars are missing", () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_PRIVATE_KEY;
    expect(() => makeAuth()).toThrow("Google 서비스 계정 환경변수 누락");
  });

  it("constructs JWT with correct email and key when env vars present", () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "svc@test.com";
    process.env.GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----";
    makeAuth();
    expect(MockJWTClass).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "svc@test.com",
        key: "-----BEGIN PRIVATE KEY-----",
      }),
    );
  });

  it("replaces escaped \\n in private key", () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "svc@test.com";
    process.env.GOOGLE_PRIVATE_KEY = "line1\\nline2\\nline3";
    makeAuth();
    expect(MockJWTClass).toHaveBeenCalledWith(
      expect.objectContaining({ key: "line1\nline2\nline3" }),
    );
  });

  it("includes spreadsheets and drive scopes", () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "svc@test.com";
    process.env.GOOGLE_PRIVATE_KEY = "key";
    makeAuth();
    const call = MockJWTClass.mock.calls[0][0];
    expect(call.scopes).toContain("https://www.googleapis.com/auth/spreadsheets");
    expect(call.scopes).toContain("https://www.googleapis.com/auth/drive");
  });

  it("returns a JWT instance", () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "svc@test.com";
    process.env.GOOGLE_PRIVATE_KEY = "key";
    const auth = makeAuth();
    expect(auth).toBeTruthy();
  });
});

describe("getToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "svc@test.com";
    process.env.GOOGLE_PRIVATE_KEY = "key";
  });

  it("returns the token string on success", async () => {
    mockGetAccessToken.mockResolvedValue({ token: "abc123" });
    const token = await getToken();
    expect(token).toBe("abc123");
  });

  it("throws when getAccessToken returns no token", async () => {
    mockGetAccessToken.mockResolvedValue({ token: null });
    await expect(getToken()).rejects.toThrow("Google 액세스 토큰 발급 실패");
  });

  it("throws when getAccessToken returns empty token string", async () => {
    mockGetAccessToken.mockResolvedValue({ token: "" });
    await expect(getToken()).rejects.toThrow("Google 액세스 토큰 발급 실패");
  });

  it("calls getAccessToken on the created JWT instance", async () => {
    mockGetAccessToken.mockResolvedValue({ token: "tok" });
    await getToken();
    expect(mockGetAccessToken).toHaveBeenCalledTimes(1);
  });
});

describe("sheetsGetValues", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    fetchSpy.mockClear();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns values from successful response", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({ values: [["a", "b"], ["c", "d"]] }));
    const result = await sheetsGetValues("token", "sheetId", "Sheet1!A1:B2");
    expect(result).toEqual([["a", "b"], ["c", "d"]]);
  });

  it("returns empty array when values is undefined in response", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    const result = await sheetsGetValues("token", "sheetId", "Sheet1!A1");
    expect(result).toEqual([]);
  });

  it("sends Authorization header with Bearer token", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({ values: [] }));
    await sheetsGetValues("mytoken", "sheetId", "range");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { Authorization: "Bearer mytoken" } }),
    );
  });

  it("encodes the range in the URL", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({ values: [] }));
    await sheetsGetValues("tok", "sid", "Sheet Name!A1:B2");
    const url: string = fetchSpy.mock.calls[0][0];
    expect(url).toContain(encodeURIComponent("Sheet Name!A1:B2"));
  });

  it("throws on non-ok response", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse("error body", false, 403));
    await expect(sheetsGetValues("token", "sid", "range")).rejects.toThrow("Sheets GET 오류 403");
  });

  it("uses GET method (no method option in fetch call for GET)", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({ values: [] }));
    await sheetsGetValues("tok", "sid", "range");
    // No method option means GET by default
    const opts = fetchSpy.mock.calls[0][1];
    expect(opts.method).toBeUndefined();
  });
});

describe("sheetsUpdateValues", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    fetchSpy.mockClear();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls fetch with PUT method and USER_ENTERED option", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    await sheetsUpdateValues("tok", "sid", "Sheet1!A1:B1", [[1, 2]]);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(opts.method).toBe("PUT");
    expect(url).toContain("valueInputOption=USER_ENTERED");
  });

  it("sends correct JSON body", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    await sheetsUpdateValues("tok", "sid", "Sheet1!A1", [["val"]]);
    const opts = fetchSpy.mock.calls[0][1];
    const body = JSON.parse(opts.body);
    expect(body.range).toBe("Sheet1!A1");
    expect(body.values).toEqual([["val"]]);
  });

  it("throws on non-ok response", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse("fail", false, 500));
    await expect(sheetsUpdateValues("tok", "sid", "r", [[]])).rejects.toThrow("Sheets UPDATE 오류 500");
  });

  it("does not throw on success (returns void)", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    await expect(sheetsUpdateValues("tok", "sid", "r", [[]])).resolves.toBeUndefined();
  });

  it("sends Content-Type application/json header", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    await sheetsUpdateValues("tok", "sid", "r", [[]]);
    const opts = fetchSpy.mock.calls[0][1];
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });
});

describe("sheetsBatchUpdateValues", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    fetchSpy.mockClear();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the values:batchUpdate endpoint with POST", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    const data = [{ range: "Sheet1!A1", values: [["v"]] }];
    await sheetsBatchUpdateValues("tok", "sid", data);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toContain("values:batchUpdate");
    expect(opts.method).toBe("POST");
  });

  it("sends USER_ENTERED valueInputOption in body", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    const data = [{ range: "Sheet1!A1", values: [["v"]] }];
    await sheetsBatchUpdateValues("tok", "sid", data);
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.valueInputOption).toBe("USER_ENTERED");
    expect(body.data).toEqual(data);
  });

  it("throws on non-ok response", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse("bad", false, 400));
    await expect(sheetsBatchUpdateValues("tok", "sid", [])).rejects.toThrow(
      "Sheets batchUpdate(values) 오류 400",
    );
  });

  it("includes sheet ID in the URL", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    await sheetsBatchUpdateValues("tok", "my-sheet-id", []);
    const url: string = fetchSpy.mock.calls[0][0];
    expect(url).toContain("my-sheet-id");
  });
});

describe("sheetsBatchUpdateRequests", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    fetchSpy.mockClear();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the spreadsheets/:batchUpdate endpoint (not values)", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    await sheetsBatchUpdateRequests("tok", "sid", []);
    const url: string = fetchSpy.mock.calls[0][0];
    expect(url).toContain(":batchUpdate");
    expect(url).not.toContain("values:batchUpdate");
  });

  it("sends POST with requests in body", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    const requests = [{ foo: "bar" }];
    await sheetsBatchUpdateRequests("tok", "sid", requests);
    const opts = fetchSpy.mock.calls[0][1];
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.requests).toEqual(requests);
  });

  it("throws on non-ok response", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse("err", false, 429));
    await expect(sheetsBatchUpdateRequests("tok", "sid", [])).rejects.toThrow(
      "Sheets batchUpdate(requests) 오류 429",
    );
  });

  it("does not throw on success", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse({}));
    await expect(sheetsBatchUpdateRequests("tok", "sid", [])).resolves.toBeUndefined();
  });
});

describe("sheetsGetMeta", () => {
  const fetchSpy = vi.fn();

  const mockSpreadsheetResponse = {

    sheets: [
      {
        properties: {
          title: "Sheet1",
          sheetId: 42,
          gridProperties: { rowCount: 100, columnCount: 26 },
        },
        merges: [
          { sheetId: 42, startRowIndex: 0, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 1 },
        ],
      },
      {
        properties: {
          title: "Sheet2",
          sheetId: 99,
          gridProperties: { rowCount: 200, columnCount: 15 },
        },
      },
    ],
  };

  beforeEach(() => {
    fetchSpy.mockClear();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns correct metadata for a matching tab", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse(mockSpreadsheetResponse));
    const meta = await sheetsGetMeta("tok", "spreadsheetId", "Sheet1");
    expect(meta.sheetId).toBe(42);
    expect(meta.rowCount).toBe(100);
    expect(meta.columnCount).toBe(26);
  });

  it("includes merges in the result", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse(mockSpreadsheetResponse));
    const meta = await sheetsGetMeta("tok", "spreadsheetId", "Sheet1");
    expect(meta.merges).toHaveLength(1);
    expect(meta.merges[0].startRowIndex).toBe(0);
  });

  it("returns empty merges array when sheet has no merges", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse(mockSpreadsheetResponse));
    const meta = await sheetsGetMeta("tok", "spreadsheetId", "Sheet2");
    expect(meta.merges).toEqual([]);
  });

  it("throws when tab title is not found", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse(mockSpreadsheetResponse));
    await expect(sheetsGetMeta("tok", "sid", "NonExistentTab")).rejects.toThrow(
      '탭을 찾을 수 없습니다: "NonExistentTab"',
    );
  });

  it("throws on non-ok fetch response", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse("error", false, 401));
    await expect(sheetsGetMeta("tok", "sid", "Sheet1")).rejects.toThrow("시트 메타 조회 실패 401");
  });

  it("includes fields query param in request URL", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse(mockSpreadsheetResponse));
    await sheetsGetMeta("tok", "spreadsheetId", "Sheet1");
    const url: string = fetchSpy.mock.calls[0][0];
    expect(url).toContain("fields=");
  });

  it("sends Authorization header with Bearer token", async () => {
    fetchSpy.mockResolvedValue(makeFetchResponse(mockSpreadsheetResponse));
    await sheetsGetMeta("mytoken", "sid", "Sheet1");
    const opts = fetchSpy.mock.calls[0][1];
    expect(opts.headers.Authorization).toBe("Bearer mytoken");
  });
});