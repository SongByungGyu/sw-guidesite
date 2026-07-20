import { NextRequest, NextResponse } from "next/server";
import { buildCreateData, createDungeonGuideSchema, serializeBuild } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function GET(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  const dungeonKey = request.nextUrl.searchParams.get("dungeon") ?? "";
  const guides = await db.dungeonGuide.findMany({ where: { guildId: member.guildId, ...(dungeonKey ? { dungeonKey } : {}) }, include: { author: true, monsters: { orderBy: { position: "asc" } } }, orderBy: { updatedAt: "desc" }, take: 50 });
  return NextResponse.json({ guides: guides.map((guide) => ({ ...guide, author: guide.author.nickname, createdAt: guide.createdAt.toISOString(), updatedAt: guide.updatedAt.toISOString(), monsters: guide.monsters.map(serializeBuild) })) });
}

export async function POST(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  const parsed = createDungeonGuideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const input = parsed.data;
  const guide = await db.dungeonGuide.create({ data: { guildId: member.guildId, authorId: member.id, dungeonKey: input.dungeonKey, title: input.title, summary: input.summary, strategy: input.strategy, difficulty: input.difficulty, clearTime: input.clearTime, monsters: { create: input.builds.map(buildCreateData) } } });
  return NextResponse.json({ id: guide.id }, { status: 201 });
}
