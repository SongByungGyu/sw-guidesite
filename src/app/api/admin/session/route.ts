import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminCookie,
  createAdminSession,
  isAdminRequest,
  setAdminCookie,
} from "@/lib/access-auth";
import { adminSessionInputSchema } from "@/lib/access-api";
import { serverEnv } from "@/lib/env";
import { secretsEqual } from "@/lib/security";

export function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdminRequest(request) });
}

export async function POST(request: NextRequest) {
  const parsed = adminSessionInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !secretsEqual(parsed.data.key, serverEnv.ADMIN_ACCESS_KEY)) {
    return NextResponse.json({ error: "관리자 키가 올바르지 않습니다." }, { status: 401 });
  }

  const session = createAdminSession();
  const response = NextResponse.json({ authenticated: true, expiresAt: session.expiresAt });
  setAdminCookie(response, session.token);
  return response;
}

export function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearAdminCookie(response);
  return response;
}
