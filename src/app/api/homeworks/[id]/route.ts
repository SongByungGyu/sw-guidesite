import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManageGuildContent, createHomeworkSchema, homeworkBuildCreateData } from "@/lib/content-api";
import { getRequestMember } from "@/lib/member-session";

const completionSchema = z.object({ completed: z.boolean() });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => null);

  const { id } = await context.params;
  const homework = await db.homework.findFirst({
    where: { id, guildId: member.guildId, status: { not: "ARCHIVED" } },
    select: { id: true },
  });
  if (!homework) return NextResponse.json({ error: "숙제를 찾을 수 없습니다." }, { status: 404 });

  const content = createHomeworkSchema.safeParse(body);
  if (content.success) {
    if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 숙제를 수정할 수 있습니다." }, { status: 403 });
    const input = content.data;
    await db.$transaction(async (transaction) => {
      await transaction.homeworkMonster.deleteMany({ where: { homeworkId: homework.id } });
      await transaction.homework.update({ where: { id: homework.id }, data: { title: input.title, target: input.target, strategy: input.strategy, dueAt: input.dueAt ? new Date(input.dueAt) : null, monsters: { create: input.builds.map(homeworkBuildCreateData) } } });
      await transaction.auditLog.create({ data: { guildId: member.guildId, actorMemberId: member.id, action: "HOMEWORK_UPDATED", entityType: "Homework", entityId: homework.id, metadata: { title: input.title } } });
    });
    return NextResponse.json({ updated: true, id: homework.id });
  }

  const parsed = completionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: content.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });

  if (parsed.data.completed) {
    await db.homeworkCompletion.upsert({
      where: { homeworkId_memberId: { homeworkId: homework.id, memberId: member.id } },
      update: { completedAt: new Date() },
      create: { guildId: member.guildId, homeworkId: homework.id, memberId: member.id },
    });
  } else {
    await db.homeworkCompletion.deleteMany({
      where: { homeworkId: homework.id, memberId: member.id },
    });
  }

  return NextResponse.json({ completed: parsed.data.completed });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) {
    return NextResponse.json({ error: "운영진만 숙제를 삭제할 수 있습니다." }, { status: 403 });
  }

  const { id } = await context.params;
  const homework = await db.homework.findFirst({
    where: { id, guildId: member.guildId, status: { not: "ARCHIVED" } },
    select: { id: true, title: true },
  });
  if (!homework) return NextResponse.json({ error: "숙제를 찾을 수 없습니다." }, { status: 404 });

  await db.$transaction([
    db.homework.update({ where: { id: homework.id }, data: { status: "ARCHIVED" } }),
    db.auditLog.create({
      data: {
        guildId: member.guildId,
        actorMemberId: member.id,
        action: "HOMEWORK_DELETED",
        entityType: "Homework",
        entityId: homework.id,
        metadata: { title: homework.title, deletionStrategy: "archived" },
      },
    }),
  ]);

  return NextResponse.json({ deleted: true, id: homework.id });
}
