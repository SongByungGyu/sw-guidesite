import { NextRequest, NextResponse } from "next/server";
import { canManageGuildContent, createHomeworkSchema, homeworkBuildCreateData, serializeBuild } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function GET(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  const homeworks = await db.homework.findMany({ where: { guildId: member.guildId, status: { not: "ARCHIVED" } }, include: { author: true, monsters: { orderBy: { position: "asc" } }, completions: { where: { memberId: member.id }, select: { id: true } } }, orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ canCreate: canManageGuildContent(member.role), homeworks: homeworks.map((homework) => ({ ...homework, author: homework.author.nickname, completedByMe: homework.completions.length > 0, completions: undefined, dueAt: homework.dueAt?.toISOString(), createdAt: homework.createdAt.toISOString(), updatedAt: homework.updatedAt.toISOString(), monsters: homework.monsters.map(serializeBuild) })) });
}

export async function POST(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 숙제를 작성할 수 있습니다." }, { status: 403 });
  const parsed = createHomeworkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const input = parsed.data;
  const homework = await db.homework.create({ data: { guildId: member.guildId, authorId: member.id, title: input.title, target: input.target, strategy: input.strategy, dueAt: input.dueAt ? new Date(input.dueAt) : null, monsters: { create: input.builds.map(homeworkBuildCreateData) } } });
  return NextResponse.json({ id: homework.id }, { status: 201 });
}
