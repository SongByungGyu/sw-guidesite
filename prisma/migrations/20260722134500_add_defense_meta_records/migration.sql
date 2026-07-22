CREATE TABLE "DefenseMetaRecord" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "towerGrade" INTEGER NOT NULL,
    "combinationKey" TEXT NOT NULL,
    "monsterIds" TEXT[],
    "recordedOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefenseMetaRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DefenseMetaRecord_guildId_memberId_towerGrade_combinationKey_recordedOn_key" ON "DefenseMetaRecord"("guildId", "memberId", "towerGrade", "combinationKey", "recordedOn");
CREATE INDEX "DefenseMetaRecord_guildId_towerGrade_recordedOn_idx" ON "DefenseMetaRecord"("guildId", "towerGrade", "recordedOn");
CREATE INDEX "DefenseMetaRecord_guildId_combinationKey_idx" ON "DefenseMetaRecord"("guildId", "combinationKey");

ALTER TABLE "DefenseMetaRecord" ADD CONSTRAINT "DefenseMetaRecord_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DefenseMetaRecord" ADD CONSTRAINT "DefenseMetaRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "GuildMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
