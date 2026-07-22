import { NextRequest, NextResponse } from "next/server";
import { canManageGuildContent, createScheduleSchema } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 일정을 수정할 수 있습니다." }, { status: 403 });
  const parsed = createScheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });

  const { id } = await context.params;
  const schedule = await db.guildSchedule.findFirst({ where: { id, guildId: member.guildId }, select: { id: true, title: true } });
  if (!schedule) return NextResponse.json({ error: "일정을 찾을 수 없습니다." }, { status: 404 });
  const input = parsed.data;
  await db.$transaction([
    db.guildSchedule.update({ where: { id }, data: { title: input.title, category: input.category, startsAt: new Date(input.startsAt), endsAt: input.endsAt ? new Date(input.endsAt) : null } }),
    db.auditLog.create({ data: { guildId: member.guildId, actorMemberId: member.id, action: "GUILD_SCHEDULE_UPDATED", entityType: "GuildSchedule", entityId: id, metadata: { previousTitle: schedule.title, title: input.title } } }),
  ]);
  return NextResponse.json({ updated: true, id });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) {
    return NextResponse.json({ error: "운영진만 일정을 삭제할 수 있습니다." }, { status: 403 });
  }

  const { id } = await context.params;
  const schedule = await db.guildSchedule.findFirst({
    where: { id, guildId: member.guildId },
    select: { id: true, title: true, startsAt: true },
  });
  if (!schedule) return NextResponse.json({ error: "일정을 찾을 수 없습니다." }, { status: 404 });

  await db.$transaction([
    db.guildSchedule.delete({ where: { id: schedule.id } }),
    db.auditLog.create({
      data: {
        guildId: member.guildId,
        actorMemberId: member.id,
        action: "GUILD_SCHEDULE_DELETED",
        entityType: "GuildSchedule",
        entityId: schedule.id,
        metadata: { title: schedule.title, startsAt: schedule.startsAt.toISOString() },
      },
    }),
  ]);

  return NextResponse.json({ deleted: true, id: schedule.id });
}
