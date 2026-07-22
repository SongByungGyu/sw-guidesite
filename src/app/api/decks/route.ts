import { NextRequest, NextResponse } from "next/server";
import { createCombinationKey, createOffenseDeckSchema } from "@/lib/deck-api";
import { canManageGuildContent } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";
import { getMonster } from "@/lib/monster-data";

export async function GET(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });

  const defenseIds = request.nextUrl.searchParams.get("defense")?.split(",").filter(Boolean) ?? [];
  if (defenseIds.length !== 3) return NextResponse.json({ decks: [] });

  const defenses = await db.deck.findMany({
    where: {
      guildId: member.guildId,
      type: "SIEGE_DEFENSE",
      status: "PUBLISHED",
      deletedAt: null,
      monsters: { some: { monsterId: { in: defenseIds } } },
    },
    include: {
      monsters: { orderBy: { position: "asc" } },
      offenseRecommendations: {
        where: { status: "PUBLISHED", deletedAt: null },
        include: {
          author: true,
          monsters: { orderBy: { position: "asc" } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  const selected = new Set(defenseIds);
  const matchingDefenses = defenses.filter((defense) => (
    defense.monsters.filter((monster) => selected.has(monster.monsterId)).length >= 2
  ));

  return NextResponse.json({
    canManage: canManageGuildContent(member.role),
    decks: matchingDefenses.flatMap((defense) => defense.offenseRecommendations.map((deck) => ({
      id: deck.id,
      title: deck.title,
      summary: deck.strategy.length > 120 ? `${deck.strategy.slice(0, 117)}…` : deck.strategy,
      strategy: deck.strategy,
      minimumRequirements: deck.minimumRequirements,
      caution: deck.caution,
      defenseIds: defense.monsters.map((monster) => monster.monsterId),
      offenseIds: deck.monsters.map((monster) => monster.monsterId),
      leaderSlot: deck.monsters.findIndex((monster) => monster.isLeader),
      wins: 0,
      battles: 0,
      recent: "아직 사용 전",
      updatedAt: deck.updatedAt.toISOString(),
      author: deck.author.nickname,
      isOfficial: deck.isOfficial,
      persisted: true,
    }))),
  });
}

export async function POST(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });

  const parsed = createOffenseDeckSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  }

  const input = parsed.data;
  const combinationKey = createCombinationKey(input.defenseIds);
  const created = await db.$transaction(async (transaction) => {
    let defense = await transaction.deck.findFirst({
      where: { guildId: member.guildId, combinationKey, type: "SIEGE_DEFENSE", deletedAt: null },
    });
    if (!defense) {
      defense = await transaction.deck.create({
        data: {
          guildId: member.guildId,
          authorId: member.id,
          type: "SIEGE_DEFENSE",
          status: "PUBLISHED",
          title: input.defenseIds.map((id) => getMonster(id).displayName).join(" · "),
          combinationKey,
          monsters: {
            create: input.defenseIds.map((monsterId, position) => ({ monsterId, position })),
          },
        },
      });
    }

    const offense = await transaction.deck.create({
      data: {
        guildId: member.guildId,
        authorId: member.id,
        type: "SIEGE_OFFENSE",
        status: input.status === "published" ? "PUBLISHED" : "DRAFT",
        title: input.title || "제목 없는 공덱",
        strategy: input.strategy,
        minimumRequirements: input.minimumRequirements,
        caution: input.caution,
        targetDefenseId: defense.id,
        monsters: {
          create: input.offenseIds.map((monsterId, position) => ({
            monsterId,
            position,
            isLeader: position === input.leaderSlot,
          })),
        },
      },
    });
    await transaction.auditLog.create({
      data: {
        guildId: member.guildId,
        actorMemberId: member.id,
        action: input.status === "published" ? "OFFENSE_DECK_PUBLISHED" : "OFFENSE_DECK_DRAFTED",
        entityType: "Deck",
        entityId: offense.id,
        metadata: { targetDefenseId: defense.id, title: offense.title },
      },
    });
    return offense;
  });

  return NextResponse.json({
    id: created.id,
    status: created.status.toLowerCase(),
    defenseKey: combinationKey,
  }, { status: 201 });
}
