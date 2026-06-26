import { NextRequest, NextResponse } from "next/server";
import { isValidTeam } from "@/lib/config";
import { appendRow } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { team, 날짜, 상호, 항목, 금액 } = body ?? {};
  if (!isValidTeam(team)) {
    return NextResponse.json({ error: "유효하지 않은 팀입니다." }, { status: 400 });
  }
  if (!날짜 || !상호 || !항목 || !금액) {
    return NextResponse.json({ error: "모든 필드를 입력해 주세요." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(날짜)) {
    return NextResponse.json({ error: "날짜 형식이 올바르지 않습니다. YYYY-MM-DD로 입력해 주세요." }, { status: 400 });
  }
  if (!/^\d+$/.test(String(금액).trim())) {
    return NextResponse.json({ error: "금액은 숫자만 입력해 주세요." }, { status: 400 });
  }
  try {
    await appendRow(team, { 날짜, 상호, 항목, 금액 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
