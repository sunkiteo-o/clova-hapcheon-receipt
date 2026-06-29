import { NextRequest, NextResponse } from "next/server";
import { isValidRegion } from "@/lib/config";
import { getItemList } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region");
  if (!isValidRegion(region)) {
    return NextResponse.json({ error: "region 파라미터 필요 (합천, 하동, 영동 중 하나)" }, { status: 400 });
  }
  try {
    const items = await getItemList(region);
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
