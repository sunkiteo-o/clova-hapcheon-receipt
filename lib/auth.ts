import { cookies } from "next/headers";

const COOKIE_NAME = "auth_token";
const TOKEN_VALUE = "ok";

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === TOKEN_VALUE;
}

export const AUTH_COOKIE = {
  name: COOKIE_NAME,
  value: TOKEN_VALUE,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
