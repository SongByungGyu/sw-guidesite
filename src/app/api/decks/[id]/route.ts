import { NextRequest, NextResponse } from "next/server";
import { canManageGuildContent } from "@/lib/content-api";
import { createCombinationKey, createOffenseDeckSchema } from "@/lib/deck-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";
import { getMonster } from "@/lib/monster-data";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 공덱을 수정할 수 있습니다." }, { status: 403 });
  const parsed = createOffenseDeckSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { id } = await context.params;
  const offense = await db.deck.findFirst({ where: { id, guildId: member.guildId, type: "SIEGE_OFFENSE", deletedAt: null }, select: { id: true, title: true } });
  if (!offense) return NextResponse.json({ error: "공덱을 찾을 수 없습니다." }, { status: 404 });
  const input = parsed.data;
  const combinationKey = createCombinationKey(input.defenseIds);
  await db.$transaction(async (transaction) => {
    let defense = await transaction.deck.findFirst({ where: { guildId: member.guildId, combinationKey, type: "SIEGE_DEFENSE", deletedAt: null } });
    if (!defense) {
      defense = await transaction.deck.create({ data: { guildId: member.guildId, authorId: member.id, type: "SIEGE_DEFENSE", status: "PUBLISHED", title: input.defenseIds.map((monsterId) => getMonster(monsterId).displayName).join(" · "), combinationKey, monsters: { create: input.defenseIds.map((monsterId, position) => ({ monsterId, position })) } } });
    }
    await transaction.deckMonster.deleteMany({ where: { deckId: offense.id } });
    await transaction.deck.update({ where: { id: offense.id }, data: { targetDefenseId: defense.id, status: input.status === "published" ? "PUBLISHED" : "DRAFT", title: input.title || "제목 없는 공덱", strategy: input.strategy, minimumRequirements: input.minimumRequirements, caution: input.caution, version: { increment: 1 }, monsters: { create: input.offenseIds.map((monsterId, position) => ({ monsterId, position, isLeader: position === input.leaderSlot })) } } });
    await transaction.auditLog.create({ data: { guildId: member.guildId, actorMemberId: member.id, action: "OFFENSE_DECK_UPDATED", entityType: "Deck", entityId: offense.id, metadata: { previousTitle: offense.title, title: input.title, targetDefenseId: defense.id } } });
  });
  return NextResponse.json({ updated: true, id });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 공덱을 삭제할 수 있습니다." }, { status: 403 });
  const { id } = await context.params;
  const offense = await db.deck.findFirst({ where: { id, guildId: member.guildId, type: "SIEGE_OFFENSE", deletedAt: null }, select: { id: true, title: true } });
  if (!offense) return NextResponse.json({ error: "공덱을 찾을 수 없습니다." }, { status: 404 });
  await db.$transaction([
    db.deck.update({ where: { id }, data: { deletedAt: new Date() } }),
    db.auditLog.create({ data: { guildId: member.guildId, actorMemberId: member.id, action: "OFFENSE_DECK_DELETED", entityType: "Deck", entityId: id, metadata: { title: offense.title, deletionStrategy: "soft-delete" } } }),
  ]);
  return NextResponse.json({ deleted: true, id });
}
