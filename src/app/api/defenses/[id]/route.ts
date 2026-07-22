import { NextRequest, NextResponse } from "next/server";
import { buildCreateData, canManageGuildContent, createDefenseSchema } from "@/lib/content-api";
import { createCombinationKey } from "@/lib/deck-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 방덱을 수정할 수 있습니다." }, { status: 403 });
  const parsed = createDefenseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { id } = await context.params;
  const defense = await db.deck.findFirst({ where: { id, guildId: member.guildId, type: "SIEGE_DEFENSE", deletedAt: null }, select: { id: true, title: true } });
  if (!defense) return NextResponse.json({ error: "방덱을 찾을 수 없습니다." }, { status: 404 });
  const input = parsed.data;
  await db.$transaction(async (transaction) => {
    await transaction.deckMonster.deleteMany({ where: { deckId: id } });
    await transaction.deck.update({ where: { id }, data: { title: input.title, strategy: input.skillOrder, combinationKey: createCombinationKey(input.builds.map((build) => build.monsterId)), version: { increment: 1 }, monsters: { create: input.builds.map(buildCreateData) } } });
    await transaction.auditLog.create({ data: { guildId: member.guildId, actorMemberId: member.id, action: "DEFENSE_DECK_UPDATED", entityType: "Deck", entityId: id, metadata: { previousTitle: defense.title, title: input.title } } });
  });
  return NextResponse.json({ updated: true, id });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 방덱을 삭제할 수 있습니다." }, { status: 403 });
  const { id } = await context.params;
  const defense = await db.deck.findFirst({ where: { id, guildId: member.guildId, type: "SIEGE_DEFENSE", deletedAt: null }, select: { id: true, title: true } });
  if (!defense) return NextResponse.json({ error: "방덱을 찾을 수 없습니다." }, { status: 404 });
  const deletedAt = new Date();
  await db.$transaction([
    db.deck.update({ where: { id }, data: { deletedAt } }),
    db.auditLog.create({ data: { guildId: member.guildId, actorMemberId: member.id, action: "DEFENSE_DECK_DELETED", entityType: "Deck", entityId: id, metadata: { title: defense.title, deletionStrategy: "soft-delete" } } }),
  ]);
  return NextResponse.json({ deleted: true, id });
}
