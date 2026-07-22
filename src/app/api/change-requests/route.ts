import { NextRequest, NextResponse } from "next/server";
import { canManageGuildContent, createChangeRequestSchema } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function GET(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });

  const canManage = canManageGuildContent(member.role);
  const requests = await db.changeRequest.findMany({
    where: { guildId: member.guildId, ...(canManage ? {} : { authorId: member.id }) },
    include: { author: { select: { nickname: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
    canManage,
    requests: requests.map((item) => ({
      id: item.id,
      category: item.category,
      content: item.content,
      status: item.status,
      author: item.author.nickname,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });

  const parsed = createChangeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });

  const changeRequest = await db.$transaction(async (transaction) => {
    const created = await transaction.changeRequest.create({
      data: { guildId: member.guildId, authorId: member.id, ...parsed.data },
    });
    await transaction.auditLog.create({
      data: {
        guildId: member.guildId,
        actorMemberId: member.id,
        action: "CHANGE_REQUEST_CREATED",
        entityType: "ChangeRequest",
        entityId: created.id,
        metadata: { category: created.category, source: "guild-home" },
      },
    });
    return created;
  });

  return NextResponse.json({ id: changeRequest.id }, { status: 201 });
}
