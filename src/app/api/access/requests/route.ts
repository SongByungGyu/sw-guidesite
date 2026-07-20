import { NextRequest, NextResponse } from "next/server";
import {
  clearDeviceCookie,
  DEVICE_COOKIE,
  isAdminRequest,
  setDeviceCookie,
} from "@/lib/access-auth";
import { accessRequestInputSchema } from "@/lib/access-api";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { createOpaqueToken, digestSecret, secretsEqual } from "@/lib/security";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "관리자 확인이 필요합니다." }, { status: 401 });
  }

  const guild = await db.guild.findUnique({ where: { slug: serverEnv.GUILD_SLUG } });
  if (!guild) return NextResponse.json({ requests: [] });

  const requests = await db.accessRequest.findMany({
    where: { guildId: guild.id },
    orderBy: { requestedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    requests: requests.map((item) => ({
      id: item.id,
      nickname: item.nickname,
      message: item.message,
      status: item.status.toLowerCase(),
      requestedAt: item.requestedAt.toISOString(),
      reviewedAt: item.reviewedAt?.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const parsed = accessRequestInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  }

  const guild = await db.guild.findUnique({ where: { slug: serverEnv.GUILD_SLUG } });
  if (!guild || !secretsEqual(digestSecret(parsed.data.guildCode.toUpperCase()), guild.accessCodeHash)) {
    return NextResponse.json({ error: "길드 코드가 올바르지 않습니다." }, { status: 403 });
  }

  const token = createOpaqueToken();
  const created = await db.accessRequest.create({
    data: {
      guildId: guild.id,
      nickname: parsed.data.nickname,
      message: parsed.data.message,
      deviceTokenHash: digestSecret(token),
    },
  });

  const response = NextResponse.json({
    status: "pending",
    request: {
      id: created.id,
      nickname: created.nickname,
      requestedAt: created.requestedAt.toISOString(),
    },
  }, { status: 201 });
  setDeviceCookie(response, token);
  return response;
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(DEVICE_COOKIE)?.value;
  if (token) {
    await db.accessRequest.deleteMany({
      where: { deviceTokenHash: digestSecret(token), status: "PENDING" },
    });
  }
  const response = NextResponse.json({ status: "none" });
  clearDeviceCookie(response);
  return response;
}
