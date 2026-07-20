import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

const completionSchema = z.object({ completed: z.boolean() });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });

  const parsed = completionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "완료 상태를 확인해 주세요." }, { status: 400 });

  const { id } = await context.params;
  const homework = await db.homework.findFirst({
    where: { id, guildId: member.guildId, status: { not: "ARCHIVED" } },
    select: { id: true },
  });
  if (!homework) return NextResponse.json({ error: "숙제를 찾을 수 없습니다." }, { status: 404 });

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
