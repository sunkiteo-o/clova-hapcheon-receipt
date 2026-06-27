import { JWT } from "google-auth-library";

export function makeAuth(): JWT {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Google 서비스 계정 환경변수 누락");
  return new JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

export async function getToken(): Promise<string> {
  const auth = makeAuth();
  const res = await auth.getAccessToken();
  if (!res.token) throw new Error("Google 액세스 토큰 발급 실패");
  return res.token;
}

export async function sheetsGetValues(
  token: string,
  sheetId: string,
  range: string,
): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets GET 오류 ${res.status}: ${text}`);
  }
  const json = await res.json();
  return (json.values as string[][] | undefined) ?? [];
}

export async function sheetsUpdateValues(
  token: string,
  sheetId: string,
  range: string,
  values: unknown[][],
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ range, values }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets UPDATE 오류 ${res.status}: ${text}`);
  }
}

export async function sheetsBatchUpdateValues(
  token: string,
  sheetId: string,
  data: { range: string; values: unknown[][] }[],
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets batchUpdate(values) 오류 ${res.status}: ${text}`);
  }
}

export async function sheetsBatchUpdateRequests(
  token: string,
  sheetId: string,
  requests: unknown[],
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets batchUpdate(requests) 오류 ${res.status}: ${text}`);
  }
}

export interface GridRange {
  sheetId: number;
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
}

export interface SheetMeta {
  sheetId: number;
  rowCount: number;
  columnCount: number;
  merges: GridRange[];
}

export async function sheetsGetMeta(
  token: string,
  spreadsheetId: string,
  tabTitle: string,
): Promise<SheetMeta> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title,gridProperties),merges)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`시트 메타 조회 실패 ${res.status}: ${text}`);
  }
  const json = await res.json();
  const found = (
    json.sheets as {
      properties: {
        title: string;
        sheetId: number;
        gridProperties: { rowCount: number; columnCount: number };
      };
      merges?: GridRange[];
    }[]
  )?.find((s) => s.properties.title === tabTitle);
  if (!found) throw new Error(`탭을 찾을 수 없습니다: "${tabTitle}"`);
  return {
    sheetId: found.properties.sheetId,
    rowCount: found.properties.gridProperties.rowCount,
    columnCount: found.properties.gridProperties.columnCount,
    merges: found.merges ?? [],
  };
}
