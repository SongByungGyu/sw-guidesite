ALTER TABLE "GuildMember"
ADD COLUMN "loginId" TEXT,
ADD COLUMN "loginIdNormalized" TEXT,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMP(3),
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

ALTER TABLE "AccessRequest"
ADD COLUMN "loginId" TEXT,
ADD COLUMN "loginIdNormalized" TEXT,
ADD COLUMN "passwordHash" TEXT;

CREATE UNIQUE INDEX "GuildMember_guildId_loginIdNormalized_key" ON "GuildMember"("guildId", "loginIdNormalized");
CREATE INDEX "AccessRequest_guildId_loginIdNormalized_idx" ON "AccessRequest"("guildId", "loginIdNormalized");
