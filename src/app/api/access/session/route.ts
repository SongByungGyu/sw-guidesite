import { NextRequest, NextResponse } from "next/server";
import { DEVICE_COOKIE } from "@/lib/access-auth";
import { db } from "@/lib/db";
import { digestSecret } from "@/lib/security";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(DEVICE_COOKIE)?.value;
  if (!token) return NextResponse.json({ status: "none" });

  const tokenHash = digestSecret(token);
  const accessRequest = await db.accessRequest.findUnique({
    where: { deviceTokenHash: tokenHash },
  });
  if (!accessRequest) return NextResponse.json({ status: "none" });

  const requestSummary = {
    id: accessRequest.id,
    nickname: accessRequest.nickname,
    requestedAt: accessRequest.requestedAt.toISOString(),
  };

  if (accessRequest.status !== "APPROVED") {
    return NextResponse.json({
      status: accessRequest.status.toLowerCase(),
      request: requestSummary,
    });
  }

  const session = await db.deviceSession.findUnique({
    where: { tokenHash },
    include: { member: true },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.member.active) {
    return NextResponse.json({ status: "none" });
  }

  await db.deviceSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({
    status: "approved",
    request: requestSummary,
    member: { nickname: session.member.nickname, role: session.member.role },
  });
}
