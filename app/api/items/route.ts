import { NextResponse } from "next/server";
import { getRegionFromCookies } from "@/lib/auth";
import { getItemList } from "@/lib/sheets";

export async function GET() {
  const region = await getRegionFromCookies();
  if (!region) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const items = await getItemList(region);
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
