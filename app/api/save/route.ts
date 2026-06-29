import { NextRequest, NextResponse } from "next/server";
import { isValidRegion, isValidCategory } from "@/lib/config";
import { saveRecord } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { region, tab, 지출일자, 항목, 금액, 비고, imageUrl } = body ?? {};

  if (!isValidRegion(region)) {
    return NextResponse.json({ error: "region 필드 필요 (합천, 하동, 영동 중 하나)" }, { status: 400 });
  }
  if (!isValidCategory(tab)) {
    return NextResponse.json({ error: "tab 필드 필요 (일반 또는 취사)" }, { status: 400 });
  }
  if (!지출일자 || !금액) {
    return NextResponse.json({ error: "지출일자·금액은 필수입니다" }, { status: 400 });
  }
  if (tab === "일반" && !항목) {
    return NextResponse.json({ error: "일반 탭은 항목이 필수입니다" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(지출일자)) {
    return NextResponse.json({ error: "날짜 형식 오류 (YYYY-MM-DD)" }, { status: 400 });
  }

  const 금액Num = parseInt(String(금액).replace(/[^0-9]/g, ""), 10);
  if (isNaN(금액Num) || 금액Num <= 0) {
    return NextResponse.json({ error: "금액은 양수 정수여야 합니다" }, { status: 400 });
  }

  try {
    const result = await saveRecord(
      region,
      tab,
      { 지출일자, 항목, 금액: 금액Num, 비고: 비고 ?? "" },
      imageUrl as string | undefined,
    );
    return NextResponse.json({ ok: true, no: result.no });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
