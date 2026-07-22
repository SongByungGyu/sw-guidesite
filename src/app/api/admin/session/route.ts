import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminCookie,
  createAdminSession,
  DEVICE_SESSION_DAYS,
  isAdminRequest,
  setAdminCookie,
  setDeviceCookie,
} from "@/lib/access-auth";
import { adminSessionInputSchema } from "@/lib/access-api";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { createOpaqueToken, digestSecret, secretsEqual } from "@/lib/security";

export function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdminRequest(request) });
}

export async function POST(request: NextRequest) {
  const parsed = adminSessionInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !secretsEqual(parsed.data.key, serverEnv.ADMIN_ACCESS_KEY)) {
    return NextResponse.json({ error: "관리자 키가 올바르지 않습니다." }, { status: 401 });
  }

  const guild = await db.guild.findUnique({ where: { slug: serverEnv.GUILD_SLUG }, select: { id: true } });
  if (!guild) return NextResponse.json({ error: "길드 정보를 찾을 수 없습니다." }, { status: 503 });

  const owner = await db.guildMember.findFirst({
    where: { guildId: guild.id, role: "OWNER", active: true },
    select: { id: true, nickname: true, loginIdNormalized: true, passwordHash: true },
  });
  if (!owner) return NextResponse.json({ error: "길드장 계정이 준비되지 않았습니다." }, { status: 503 });

  const adminSession = createAdminSession();
  const deviceToken = createOpaqueToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEVICE_SESSION_DAYS);

  await db.$transaction([
    db.deviceSession.create({
      data: { memberId: owner.id, tokenHash: digestSecret(deviceToken), expiresAt },
    }),
    db.auditLog.create({
      data: {
        guildId: guild.id,
        actorMemberId: owner.id,
        action: "OWNER_DEVICE_SESSION_CREATED",
        entityType: "GuildMember",
        entityId: owner.id,
        metadata: { source: "admin-key" },
      },
    }),
  ]);

  const response = NextResponse.json({
    authenticated: true,
    expiresAt: adminSession.expiresAt,
    member: { nickname: owner.nickname, role: "OWNER", credentialsReady: Boolean(owner.loginIdNormalized && owner.passwordHash) },
  });
  setAdminCookie(response, adminSession.token);
  setDeviceCookie(response, deviceToken);
  return response;
}

export function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearAdminCookie(response);
  return response;
}
