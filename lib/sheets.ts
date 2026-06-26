import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { Team, tabNameForTeam, DEFAULT_STATUS, HEADERS } from "./config";

function now(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getAuth(): JWT {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Google 서비스 계정 환경변수 누락");
  return new JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
}

export interface RowData {
  날짜: string;
  상호: string;
  항목: string;
  금액: string | number;
}

export async function appendRow(team: Team, data: RowData): Promise<void> {
  const auth = getAuth();
  const sheetId = process.env.SHEET_ID;
  if (!sheetId) throw new Error("SHEET_ID 환경변수 누락");

  const doc = new GoogleSpreadsheet(sheetId, auth);
  await doc.loadInfo();

  const tabName = tabNameForTeam(team);
  const sheet = doc.sheetsByTitle[tabName];
  if (!sheet) throw new Error(`탭을 찾을 수 없습니다: "${tabName}"`);

  await sheet.loadHeaderRow();
  const headers = sheet.headerValues;
  const missing = HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) throw new Error(`헤더 불일치 — 누락: ${missing.join(", ")}`);

  await sheet.addRow({
    날짜: data.날짜,
    팀: team,
    상호: data.상호,
    항목: data.항목,
    금액: String(data.금액),
    상태: DEFAULT_STATUS,
    입력시간: now(),
  });
}
