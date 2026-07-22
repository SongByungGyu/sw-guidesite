import { NextRequest, NextResponse } from "next/server";
import { changeRequestStatusInputSchema } from "@/lib/access-api";
import { canManageGuildContent } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) {
    return NextResponse.json({ error: "운영진만 요청 상태를 변경할 수 있습니다." }, { status: 403 });
  }

  const parsed = changeRequestStatusInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "변경할 상태를 확인해 주세요." }, { status: 400 });

  const { id } = await context.params;
  const item = await db.changeRequest.findFirst({ where: { id, guildId: member.guildId } });
  if (!item) return NextResponse.json({ error: "수정 요청을 찾을 수 없습니다." }, { status: 404 });

  const updated = await db.$transaction(async (transaction) => {
    const result = await transaction.changeRequest.update({ where: { id }, data: { status: parsed.data.status } });
    await transaction.auditLog.create({
      data: {
        guildId: member.guildId,
        actorMemberId: member.id,
        action: "CHANGE_REQUEST_STATUS_CHANGED",
        entityType: "ChangeRequest",
        entityId: item.id,
        metadata: { from: item.status, to: parsed.data.status },
      },
    });
    return result;
  });

  return NextResponse.json({ id: updated.id, status: updated.status, updatedAt: updated.updatedAt.toISOString() });
}
