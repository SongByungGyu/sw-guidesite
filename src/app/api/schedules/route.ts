import { NextRequest, NextResponse } from "next/server";
import { canManageGuildContent, createScheduleSchema } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function POST(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) {
    return NextResponse.json({ error: "운영진만 일정을 추가할 수 있습니다." }, { status: 403 });
  }

  const parsed = createScheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });

  const schedule = await db.$transaction(async (transaction) => {
    const created = await transaction.guildSchedule.create({
      data: {
        guildId: member.guildId,
        authorId: member.id,
        title: parsed.data.title,
        category: parsed.data.category,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      },
    });
    await transaction.auditLog.create({
      data: {
        guildId: member.guildId,
        actorMemberId: member.id,
        action: "GUILD_SCHEDULE_CREATED",
        entityType: "GuildSchedule",
        entityId: created.id,
        metadata: { title: created.title, startsAt: created.startsAt.toISOString() },
      },
    });
    return created;
  });

  return NextResponse.json({ id: schedule.id }, { status: 201 });
}
