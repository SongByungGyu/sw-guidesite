import type { NextRequest } from "next/server";
import { DEVICE_COOKIE } from "@/lib/access-auth";
import { db } from "@/lib/db";
import { digestSecret } from "@/lib/security";

export async function getRequestMember(request: NextRequest) {
  const token = request.cookies.get(DEVICE_COOKIE)?.value;
  if (!token) return null;

  const session = await db.deviceSession.findUnique({
    where: { tokenHash: digestSecret(token) },
    include: { member: true },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.member.active) {
    return null;
  }
  return session.member;
}
