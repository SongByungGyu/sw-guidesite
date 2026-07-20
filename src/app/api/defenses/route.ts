import { NextRequest, NextResponse } from "next/server";
import { buildCreateData, createDefenseSchema, serializeBuild } from "@/lib/content-api";
import { createCombinationKey } from "@/lib/deck-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function GET(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  const decks = await db.deck.findMany({
    where: { guildId: member.guildId, type: "SIEGE_DEFENSE", deletedAt: null },
    include: { author: true, monsters: { orderBy: { position: "asc" } }, offenseRecommendations: { where: { status: "PUBLISHED", deletedAt: null }, select: { id: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({
    member: { id: member.id, role: member.role },
    defenses: decks.map((deck) => ({ id: deck.id, title: deck.title, note: deck.strategy, author: deck.author.nickname, authorId: deck.authorId, updatedAt: deck.updatedAt.toISOString(), recommendationCount: deck.offenseRecommendations.length, monsters: deck.monsters.map(serializeBuild) })),
  });
}

export async function POST(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  const parsed = createDefenseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const input = parsed.data;
  const deck = await db.deck.create({
    data: {
      guildId: member.guildId,
      authorId: member.id,
      type: "SIEGE_DEFENSE",
      status: "PUBLISHED",
      title: input.title,
      strategy: input.note,
      combinationKey: createCombinationKey(input.builds.map((build) => build.monsterId)),
      monsters: { create: input.builds.map(buildCreateData) },
    },
  });
  return NextResponse.json({ id: deck.id }, { status: 201 });
}
