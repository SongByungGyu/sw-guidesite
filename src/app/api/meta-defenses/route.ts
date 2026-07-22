import { NextRequest, NextResponse } from "next/server";
import { buildMetaDefenseTop, createCombinationKey, recordMetaDefenseSchema } from "@/lib/deck-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

const DAY_MS = 24 * 60 * 60 * 1000;

function getKoreaDate() {
  const koreaDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return new Date(`${koreaDate}T00:00:00.000Z`);
}

function recentLabel(updatedAt: Date) {
  const days = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / DAY_MS));
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}

export async function GET(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "길드 승인이 필요합니다." }, { status: 401 });

  const since = getKoreaDate();
  since.setUTCDate(since.getUTCDate() - 29);

  const records = await db.defenseMetaRecord.findMany({
    where: { guildId: member.guildId, recordedOn: { gte: since } },
    select: { towerGrade: true, combinationKey: true, monsterIds: true, recordedOn: true },
  });
  const top = buildMetaDefenseTop(records);
  const keys = [...top.fiveStar, ...top.fourStar].map((row) => row.combinationKey);
  const defenses = keys.length ? await db.deck.findMany({
    where: {
      guildId: member.guildId,
      type: "SIEGE_DEFENSE",
      status: "PUBLISHED",
      deletedAt: null,
      combinationKey: { in: keys },
    },
    include: {
      offenseRecommendations: {
        where: { status: "PUBLISHED", deletedAt: null },
        include: { author: true, monsters: { orderBy: { position: "asc" } } },
        orderBy: [{ isOfficial: "desc" }, { updatedAt: "desc" }],
      },
    },
  }) : [];

  const offenseByKey = new Map<string, ReturnType<typeof serializeOffense>[] >();
  for (const defense of defenses) {
    if (!defense.combinationKey) continue;
    const current = offenseByKey.get(defense.combinationKey) ?? [];
    current.push(...defense.offenseRecommendations.map((offense) => serializeOffense(offense, defense.combinationKey!)));
    offenseByKey.set(defense.combinationKey, current);
  }

  const withOffenses = (row: (typeof top.fiveStar)[number]) => {
    const offenseDecks = (offenseByKey.get(row.combinationKey) ?? []).slice(0, 3);
    return { ...row, offenseCount: offenseByKey.get(row.combinationKey)?.length ?? 0, offenseDecks };
  };

  return NextResponse.json({
    periodDays: 30,
    fiveStar: top.fiveStar.map(withOffenses),
    fourStar: top.fourStar.map(withOffenses),
  });
}

export async function POST(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "길드 승인이 필요합니다." }, { status: 401 });

  const parsed = recordMetaDefenseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  }

  const combinationKey = createCombinationKey(parsed.data.monsterIds);
  const recordedOn = getKoreaDate();
  const uniqueKey = {
    guildId: member.guildId,
    memberId: member.id,
    towerGrade: parsed.data.towerGrade,
    combinationKey,
    recordedOn,
  };
  const existing = await db.defenseMetaRecord.findUnique({
    where: { guildId_memberId_towerGrade_combinationKey_recordedOn: uniqueKey },
  });
  if (existing) {
    return NextResponse.json({ recorded: false, message: "오늘 이미 기록한 방덱입니다." });
  }

  const record = await db.$transaction(async (transaction) => {
    const created = await transaction.defenseMetaRecord.create({
      data: { ...uniqueKey, monsterIds: [...parsed.data.monsterIds].sort((left, right) => left.localeCompare(right)) },
    });
    await transaction.auditLog.create({
      data: {
        guildId: member.guildId,
        actorMemberId: member.id,
        action: "DEFENSE_META_RECORDED",
        entityType: "DefenseMetaRecord",
        entityId: created.id,
        metadata: { towerGrade: created.towerGrade, combinationKey: created.combinationKey },
      },
    });
    return created;
  });

  return NextResponse.json({ recorded: true, id: record.id, message: "실전 방덱 기록을 반영했습니다." }, { status: 201 });
}

function serializeOffense(offense: {
  id: string;
  title: string;
  strategy: string;
  isOfficial: boolean;
  updatedAt: Date;
  author: { nickname: string };
  monsters: Array<{ monsterId: string; isLeader: boolean }>;
}, combinationKey: string) {
  const leaderIndex = offense.monsters.findIndex((monster) => monster.isLeader);
  return {
    id: offense.id,
    title: offense.title,
    summary: offense.strategy.length > 120 ? `${offense.strategy.slice(0, 117)}...` : offense.strategy,
    defenseIds: combinationKey.split(":"),
    offenseIds: offense.monsters.map((monster) => monster.monsterId),
    leaderSlot: leaderIndex >= 0 && leaderIndex <= 2 ? leaderIndex : 0,
    wins: 0,
    battles: 0,
    recent: recentLabel(offense.updatedAt),
    updatedAt: offense.updatedAt.toISOString(),
    author: offense.author.nickname,
    isOfficial: offense.isOfficial,
  };
}
