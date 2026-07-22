import { NextRequest, NextResponse } from "next/server";
import { canManageGuildContent, createAnnouncementSchema } from "@/lib/content-api";
import { db } from "@/lib/db";
import { getRequestMember } from "@/lib/member-session";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 공지를 수정할 수 있습니다." }, { status: 403 });

  const parsed = createAnnouncementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { id } = await context.params;
  const announcement = await db.announcement.findFirst({ where: { id, guildId: member.guildId }, select: { id: true, title: true } });
  if (!announcement) return NextResponse.json({ error: "공지를 찾을 수 없습니다." }, { status: 404 });

  await db.$transaction([
    db.announcement.update({ where: { id }, data: parsed.data }),
    db.auditLog.create({ data: { guildId: member.guildId, actorMemberId: member.id, action: "ANNOUNCEMENT_UPDATED", entityType: "Announcement", entityId: id, metadata: { previousTitle: announcement.title, title: parsed.data.title } } }),
  ]);
  return NextResponse.json({ updated: true, id });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const member = await getRequestMember(request);
  if (!member) return NextResponse.json({ error: "접근 승인이 필요합니다." }, { status: 401 });
  if (!canManageGuildContent(member.role)) return NextResponse.json({ error: "운영진만 공지를 삭제할 수 있습니다." }, { status: 403 });

  const { id } = await context.params;
  const announcement = await db.announcement.findFirst({ where: { id, guildId: member.guildId }, select: { id: true, title: true } });
  if (!announcement) return NextResponse.json({ error: "공지를 찾을 수 없습니다." }, { status: 404 });
  await db.$transaction([
    db.announcement.delete({ where: { id } }),
    db.auditLog.create({ data: { guildId: member.guildId, actorMemberId: member.id, action: "ANNOUNCEMENT_DELETED", entityType: "Announcement", entityId: id, metadata: { title: announcement.title } } }),
  ]);
  return NextResponse.json({ deleted: true, id });
}
