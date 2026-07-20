import type { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { createSignedToken, verifySignedToken } from "@/lib/security";

export const DEVICE_COOKIE = "guild_archive_device";
export const ADMIN_COOKIE = "guild_archive_admin";
export const DEVICE_SESSION_DAYS = 90;
const ADMIN_SESSION_HOURS = 12;

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: serverEnv.NODE_ENV === "production",
  path: "/",
};

export function setDeviceCookie(response: NextResponse, token: string) {
  response.cookies.set(DEVICE_COOKIE, token, {
    ...baseCookieOptions,
    maxAge: DEVICE_SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearDeviceCookie(response: NextResponse) {
  response.cookies.set(DEVICE_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
}

export function createAdminSession() {
  const expiresAt = Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000;
  return {
    token: createSignedToken(String(expiresAt), serverEnv.SESSION_SECRET),
    expiresAt,
  };
}

export function setAdminCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE, token, {
    ...baseCookieOptions,
    maxAge: ADMIN_SESSION_HOURS * 60 * 60,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
}

export function isAdminRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const payload = verifySignedToken(token, serverEnv.SESSION_SECRET);
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}
