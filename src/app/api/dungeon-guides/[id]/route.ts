import { NextRequest, NextResponse } from "next/server";
import { buildCreateData, canManageGuildContent, createDungeonGuideSchema } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 던전 공략을 수정할 수 있습니다." }, { status: 403 });
  const parsed = createDungeonGuideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { id } = await context.params;
  const guide = await db.dungeonGuide.findFirst({ where: { id, guildId: member.guildId }, select: { id: true, title: true } });
  if (!guide) return NextResponse.json({ error: "던전 공략을 찾을 수 없습니다." }, { status: 404 });
  const input = parsed.data;
  await db.$transaction(async (transaction) => {
    await transaction.dungeonGuideMonster.deleteMany({ where: { guideId: id } });
    await transaction.dungeonGuide.update({ where: { id }, data: { dungeonKey: input.dungeonKey, title: input.title, summary: input.summary, strategy: input.strategy, difficulty: input.difficulty, clearTime: input.clearTime, monsters: { create: input.builds.map(buildCreateData) } } });
    await transaction.auditLog.create({ data: { guildId: member.guildId, actorMemberId: member.id, action: "DUNGEON_GUIDE_UPDATED", entityType: "DungeonGuide", entityId: id, metadata: { previousTitle: guide.title, title: input.title } } });
  });
  return NextResponse.json({ updated: true, id });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 던전 공략을 삭제할 수 있습니다." }, { status: 403 });
  const { id } = await context.params;
  const guide = await db.dungeonGuide.findFirst({ where: { id, guildId: member.guildId }, select: { id: true, title: true } });
  if (!guide) return NextResponse.json({ error: "던전 공략을 찾을 수 없습니다." }, { status: 404 });
  await db.$transaction([
    db.dungeonGuide.delete({ where: { id } }),
    db.auditLog.create({ data: { guildId: member.guildId, actorMemberId: member.id, action: "DUNGEON_GUIDE_DELETED", entityType: "DungeonGuide", entityId: id, metadata: { title: guide.title } } }),
  ]);
  return NextResponse.json({ deleted: true, id });
}
