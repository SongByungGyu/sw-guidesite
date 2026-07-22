import { NextRequest, NextResponse } from "next/server";
import { accountCredentialsInputSchema, normalizeLoginId } from "@/lib/access-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";
import { hashPassword } from "@/lib/security";

export async function POST(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "승인된 기기에서 계정을 설정해 주세요." }, { status: 401 });
  if (member.loginIdNormalized || member.passwordHash) {
    return NextResponse.json({ error: "이미 로그인 계정이 설정되어 있습니다." }, { status: 409 });
  }

  const parsed = accountCredentialsInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  }

  const loginIdNormalized = normalizeLoginId(parsed.data.loginId);
  const duplicate = await db.guildMember.findFirst({
    where: { guildId: member.guildId, loginIdNormalized, id: { not: member.id } },
    select: { id: true },
  });
  if (duplicate) return NextResponse.json({ error: "이미 사용 중인 로그인 아이디입니다." }, { status: 409 });

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.guildMember.update({
      where: { id: member.id },
      data: {
        loginId: parsed.data.loginId,
        loginIdNormalized,
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
    db.auditLog.create({
      data: {
        guildId: member.guildId,
        actorMemberId: member.id,
        action: "MEMBER_CREDENTIALS_CREATED",
        entityType: "GuildMember",
        entityId: member.id,
        metadata: { loginId: parsed.data.loginId, source: "approved-device" },
      },
    }),
  ]);

  return NextResponse.json({ credentialsReady: true, loginId: parsed.data.loginId }, { status: 201 });
}
