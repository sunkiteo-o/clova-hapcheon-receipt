import { NextRequest, NextResponse } from "next/server";
import { isValidTabType } from "@/lib/config";
import { getItemList } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab");
  if (!isValidTabType(tab)) {
    return NextResponse.json({ error: "tab 파라미터 필요 (일반 또는 취사)" }, { status: 400 });
  }
  try {
    const items = await getItemList(tab);
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
