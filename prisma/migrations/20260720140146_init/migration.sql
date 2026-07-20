-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'OFFICER', 'MEMBER');

-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessCodeHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildMember" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "deviceTokenHash" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByMemberId" TEXT,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceSession" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "actorMemberId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_slug_key" ON "Guild"("slug");

-- CreateIndex
CREATE INDEX "GuildMember_guildId_role_idx" ON "GuildMember"("guildId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "GuildMember_guildId_nickname_key" ON "GuildMember"("guildId", "nickname");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequest_deviceTokenHash_key" ON "AccessRequest"("deviceTokenHash");

-- CreateIndex
CREATE INDEX "AccessRequest_guildId_status_requestedAt_idx" ON "AccessRequest"("guildId", "status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_tokenHash_key" ON "DeviceSession"("tokenHash");

-- CreateIndex
CREATE INDEX "DeviceSession_memberId_expiresAt_idx" ON "DeviceSession"("memberId", "expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_guildId_createdAt_idx" ON "AuditLog"("guildId", "createdAt");

-- AddForeignKey
ALTER TABLE "GuildMember" ADD CONSTRAINT "GuildMember_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_reviewedByMemberId_fkey" FOREIGN KEY ("reviewedByMemberId") REFERENCES "GuildMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "GuildMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorMemberId_fkey" FOREIGN KEY ("actorMemberId") REFERENCES "GuildMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
