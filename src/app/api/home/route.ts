import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";
import { canManageGuildContent, serializeBuild } from "@/lib/content-api";

export async function GET(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });

  const [announcements, schedules, homeworks] = await Promise.all([
    db.announcement.findMany({ where: { guildId: member.guildId }, include: { author: true }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 5 }),
    db.guildSchedule.findMany({ where: { guildId: member.guildId, startsAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, orderBy: { startsAt: "asc" }, take: 8 }),
    db.homework.findMany({ where: { guildId: member.guildId, status: "ACTIVE" }, include: { author: true, monsters: { orderBy: { position: "asc" } }, completions: { where: { memberId: member.id }, select: { id: true } } }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], take: 6 }),
  ]);

  return NextResponse.json({
    member: { nickname: member.nickname, role: member.role },
    canManage: canManageGuildContent(member.role),
    announcements: announcements.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), author: item.author.nickname })),
    schedules: schedules.map((item) => ({ ...item, startsAt: item.startsAt.toISOString(), endsAt: item.endsAt?.toISOString(), createdAt: item.createdAt.toISOString() })),
    homeworks: homeworks.map((item) => ({ ...item, completedByMe: item.completions.length > 0, completions: undefined, dueAt: item.dueAt?.toISOString(), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), author: item.author.nickname, monsters: item.monsters.map(serializeBuild) })),
  });
}
