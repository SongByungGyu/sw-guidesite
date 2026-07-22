import { NextRequest, NextResponse } from "next/server";
import { DEVICE_SESSION_DAYS, isAdminRequest } from "@/lib/access-auth";
import { accessReviewInputSchema } from "@/lib/access-api";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "관리자 확인이 필요합니다." }, { status: 401 });
  }

  const parsed = accessReviewInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "처리 상태를 확인해 주세요." }, { status: 400 });

  const { id } = await context.params;
  const accessRequest = await db.accessRequest.findUnique({ where: { id } });
  if (!accessRequest) return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 });
  if (accessRequest.status !== "PENDING") {
    return NextResponse.json({ error: "이미 처리된 요청입니다." }, { status: 409 });
  }

  const owner = await db.guildMember.findFirst({
    where: { guildId: accessRequest.guildId, role: "OWNER", active: true },
  });
  const reviewedAt = new Date();

  await db.$transaction(async (transaction) => {
    if (parsed.data.status === "approved") {
      const credentials = accessRequest.loginId && accessRequest.loginIdNormalized && accessRequest.passwordHash ? {
        loginId: accessRequest.loginId,
        loginIdNormalized: accessRequest.loginIdNormalized,
        passwordHash: accessRequest.passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      } : {};
      const member = await transaction.guildMember.upsert({
        where: {
          guildId_nickname: { guildId: accessRequest.guildId, nickname: accessRequest.nickname },
        },
        update: { active: true, ...credentials },
        create: {
          guildId: accessRequest.guildId,
          nickname: accessRequest.nickname,
          role: "MEMBER",
          ...credentials,
        },
      });
      const expiresAt = new Date(reviewedAt);
      expiresAt.setDate(expiresAt.getDate() + DEVICE_SESSION_DAYS);
      await transaction.deviceSession.create({
        data: {
          memberId: member.id,
          tokenHash: accessRequest.deviceTokenHash,
          expiresAt,
        },
      });
    }

    await transaction.accessRequest.update({
      where: { id },
      data: {
        status: parsed.data.status === "approved" ? "APPROVED" : "REJECTED",
        reviewedAt,
        reviewedByMemberId: owner?.id,
        passwordHash: null,
      },
    });
    await transaction.auditLog.create({
      data: {
        guildId: accessRequest.guildId,
        actorMemberId: owner?.id,
        action: parsed.data.status === "approved" ? "ACCESS_REQUEST_APPROVED" : "ACCESS_REQUEST_REJECTED",
        entityType: "AccessRequest",
        entityId: id,
        metadata: { nickname: accessRequest.nickname, loginId: accessRequest.loginId, source: "admin-key" },
      },
    });
  });

  return NextResponse.json({ status: parsed.data.status, reviewedAt: reviewedAt.toISOString(), guild: serverEnv.GUILD_SLUG });
}
