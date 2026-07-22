import { NextRequest, NextResponse } from "next/server";
import { DEVICE_SESSION_DAYS, setDeviceCookie } from "@/lib/access-auth";
import { accessLoginInputSchema, normalizeLoginId } from "@/lib/access-api";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { createOpaqueToken, digestSecret, hashPassword, verifyPassword } from "@/lib/security";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const LOGIN_ERROR = "로그인 아이디 또는 비밀번호가 올바르지 않습니다.";

export async function POST(request: NextRequest) {
  const parsed = accessLoginInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  }

  const guild = await db.guild.findUnique({ where: { slug: serverEnv.GUILD_SLUG }, select: { id: true } });
  if (!guild) return NextResponse.json({ error: "길드 정보를 찾을 수 없습니다." }, { status: 503 });

  const loginIdNormalized = normalizeLoginId(parsed.data.loginId);
  const member = await db.guildMember.findFirst({
    where: { guildId: guild.id, loginIdNormalized, active: true },
  });

  if (!member?.passwordHash) {
    await hashPassword(parsed.data.password);
    return NextResponse.json({ error: LOGIN_ERROR }, { status: 401 });
  }

  const now = new Date();
  if (member.lockedUntil && member.lockedUntil > now) {
    return NextResponse.json({ error: "로그인 시도가 많습니다. 15분 후 다시 시도해 주세요." }, { status: 429 });
  }

  const passwordMatches = await verifyPassword(parsed.data.password, member.passwordHash);
  if (!passwordMatches) {
    const previousCount = member.lockedUntil && member.lockedUntil <= now ? 0 : member.failedLoginCount;
    const failedLoginCount = previousCount + 1;
    const shouldLock = failedLoginCount >= MAX_FAILED_LOGINS;
    const lockedUntil = shouldLock ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000) : null;
    await db.guildMember.update({
      where: { id: member.id },
      data: { failedLoginCount: shouldLock ? 0 : failedLoginCount, lockedUntil },
    });
    return NextResponse.json({ error: shouldLock ? "로그인 시도가 많습니다. 15분 후 다시 시도해 주세요." : LOGIN_ERROR }, { status: shouldLock ? 429 : 401 });
  }

  const token = createOpaqueToken();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + DEVICE_SESSION_DAYS);
  await db.$transaction([
    db.deviceSession.create({
      data: { memberId: member.id, tokenHash: digestSecret(token), expiresAt },
    }),
    db.guildMember.update({
      where: { id: member.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now },
    }),
    db.auditLog.create({
      data: {
        guildId: member.guildId,
        actorMemberId: member.id,
        action: "MEMBER_PASSWORD_LOGIN",
        entityType: "GuildMember",
        entityId: member.id,
        metadata: { source: "password" },
      },
    }),
  ]);

  const response = NextResponse.json({
    status: "approved",
    member: { nickname: member.nickname, role: member.role, credentialsReady: true },
  });
  setDeviceCookie(response, token);
  return response;
}
