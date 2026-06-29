import { cookies } from "next/headers";
import { isValidRegion } from "@/lib/config";
import type { Region } from "@/lib/config";

const AUTH_COOKIE_NAME = "auth_token";
const REGION_COOKIE_NAME = "auth_region";

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value === "ok";
}

export const AUTH_COOKIE = {
  name: AUTH_COOKIE_NAME,
  value: "ok",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

async function getHmacKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error("COOKIE_SECRET env var not set");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage,
  );
}

export async function buildRegionCookieValue(region: Region): Promise<string> {
  const key = await getHmacKey(["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(region));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${region}:${hex}`;
}

export async function verifyRegionCookie(cookieValue: string): Promise<Region | null> {
  const colonIdx = cookieValue.lastIndexOf(":");
  if (colonIdx === -1) return null;
  const regionStr = cookieValue.slice(0, colonIdx);
  if (!isValidRegion(regionStr)) return null;
  const hexStr = cookieValue.slice(colonIdx + 1);
  const bytes = hexStr.match(/.{2}/g)?.map((b) => parseInt(b, 16));
  if (!bytes || bytes.length === 0) return null;
  const sig = Uint8Array.from(bytes);
  const key = await getHmacKey(["verify"]);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    new TextEncoder().encode(regionStr),
  );
  return valid ? regionStr : null;
}

export function regionCookieOptions(value: string) {
  return {
    name: REGION_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function getRegionFromCookies(): Promise<Region | null> {
  const store = await cookies();
  const cookieValue = store.get(REGION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;
  return verifyRegionCookie(cookieValue);
}
