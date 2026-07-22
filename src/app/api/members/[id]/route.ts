import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/access-auth";
import { memberRoleInputSchema } from "@/lib/access-api";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "관리자 확인이 필요합니다." }, { status: 401 });
  }

  const parsed = memberRoleInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "변경할 권한을 확인해 주세요." }, { status: 400 });

  const { id } = await context.params;
  const guild = await db.guild.findUnique({ where: { slug: serverEnv.GUILD_SLUG }, select: { id: true } });
  if (!guild) return NextResponse.json({ error: "길드 정보를 찾을 수 없습니다." }, { status: 404 });

  const member = await db.guildMember.findFirst({ where: { id, guildId: guild.id } });
  if (!member) return NextResponse.json({ error: "길드원을 찾을 수 없습니다." }, { status: 404 });
  if (member.role === "OWNER") return NextResponse.json({ error: "길드장 권한은 변경할 수 없습니다." }, { status: 409 });

  const owner = await db.guildMember.findFirst({ where: { guildId: guild.id, role: "OWNER", active: true }, select: { id: true } });
  const updated = await db.$transaction(async (transaction) => {
    const result = await transaction.guildMember.update({ where: { id: member.id }, data: { role: parsed.data.role } });
    await transaction.auditLog.create({
      data: {
        guildId: guild.id,
        actorMemberId: owner?.id,
        action: "MEMBER_ROLE_CHANGED",
        entityType: "GuildMember",
        entityId: member.id,
        metadata: { nickname: member.nickname, from: member.role, to: parsed.data.role, source: "admin-key" },
      },
    });
    return result;
  });

  return NextResponse.json({ id: updated.id, nickname: updated.nickname, role: updated.role });
}
