import { NextRequest, NextResponse } from "next/server";
import { serializeBuild } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function GET(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });

  const homeworks = await db.homework.findMany({
    where: { guildId: member.guildId },
    include: {
      author: { select: { nickname: true } },
      monsters: { orderBy: { position: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    homeworks: homeworks.map((homework) => ({
      id: homework.id,
      title: homework.title,
      target: homework.target,
      strategy: homework.strategy,
      dueAt: homework.dueAt?.toISOString(),
      status: homework.status,
      author: homework.author.nickname,
      updatedAt: homework.updatedAt.toISOString(),
      monsters: homework.monsters.map((build) => ({
        ...serializeBuild(build),
        artifactLeft: build.artifactLeft,
        artifactRight: build.artifactRight,
      })),
    })),
  });
}
