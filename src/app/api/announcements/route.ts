import { NextRequest, NextResponse } from "next/server";
import { canManageGuildContent, createAnnouncementSchema } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function POST(request: NextRequest) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) {
    return NextResponse.json({ error: "운영진만 공지를 작성할 수 있습니다." }, { status: 403 });
  }

  const parsed = createAnnouncementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });

  const announcement = await db.$transaction(async (transaction) => {
    const created = await transaction.announcement.create({
      data: { guildId: member.guildId, authorId: member.id, ...parsed.data },
    });
    await transaction.auditLog.create({
      data: {
        guildId: member.guildId,
        actorMemberId: member.id,
        action: "ANNOUNCEMENT_CREATED",
        entityType: "Announcement",
        entityId: created.id,
        metadata: { title: created.title, pinned: created.pinned },
      },
    });
    return created;
  });

  return NextResponse.json({ id: announcement.id }, { status: 201 });
}
