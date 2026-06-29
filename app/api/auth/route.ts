import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, buildRegionCookieValue, regionCookieOptions } from "@/lib/auth";
import type { Region } from "@/lib/config";

const PASSWORD_MAP: [string | undefined, Region][] = [
  [process.env.APP_PASSWORD_HADONG, "하동"],
  [process.env.APP_PASSWORD_HAPCHEON, "합천"],
  [process.env.APP_PASSWORD_YEONGDONG, "영동"],
];

function resolveRegion(password: string): Region | null {
  for (const [env, region] of PASSWORD_MAP) {
    if (env && password === env) return region;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "비밀번호를 입력하세요." }, { status: 401 });
  }
  const region = resolveRegion(password);
  if (!region) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
  }
  const regionCookieValue = await buildRegionCookieValue(region);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE);
  res.cookies.set(regionCookieOptions(regionCookieValue));
  return res;
}
