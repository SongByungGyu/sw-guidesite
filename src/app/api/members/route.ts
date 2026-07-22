import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/access-auth";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "관리자 확인이 필요합니다." }, { status: 401 });
  }

  const guild = await db.guild.findUnique({ where: { slug: serverEnv.GUILD_SLUG }, select: { id: true } });
  if (!guild) return NextResponse.json({ members: [] });

  const members = await db.guildMember.findMany({
    where: { guildId: guild.id },
    include: { deviceSessions: { where: { revokedAt: null }, orderBy: { lastSeenAt: "desc" }, take: 1 } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    members: members.map((member) => ({
      id: member.id,
      nickname: member.nickname,
      role: member.role,
      active: member.active,
      createdAt: member.createdAt.toISOString(),
      lastSeenAt: member.deviceSessions[0]?.lastSeenAt.toISOString(),
    })),
  });
}
