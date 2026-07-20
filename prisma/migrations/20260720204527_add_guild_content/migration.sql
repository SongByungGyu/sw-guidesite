-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- DropIndex
DROP INDEX "Deck_guildId_combinationKey_key";

-- AlterTable
ALTER TABLE "DeckMonster" ADD COLUMN     "accuracy" INTEGER,
ADD COLUMN     "attack" INTEGER,
ADD COLUMN     "critDamage" INTEGER,
ADD COLUMN     "critRate" INTEGER,
ADD COLUMN     "defense" INTEGER,
ADD COLUMN     "hp" INTEGER,
ADD COLUMN     "note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "resistance" INTEGER,
ADD COLUMN     "runeSets" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "speed" INTEGER;

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildSchedule" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DungeonGuide" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "dungeonKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT '',
    "clearTime" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DungeonGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DungeonGuideMonster" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "runeSets" TEXT NOT NULL DEFAULT '',
    "hp" INTEGER,
    "attack" INTEGER,
    "defense" INTEGER,
    "speed" INTEGER,
    "critRate" INTEGER,
    "critDamage" INTEGER,
    "resistance" INTEGER,
    "accuracy" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "DungeonGuideMonster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homework" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "status" "HomeworkStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkMonster" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "runeSets" TEXT NOT NULL DEFAULT '',
    "hp" INTEGER,
    "attack" INTEGER,
    "defense" INTEGER,
    "speed" INTEGER,
    "critRate" INTEGER,
    "critDamage" INTEGER,
    "resistance" INTEGER,
    "accuracy" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "HomeworkMonster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_guildId_pinned_createdAt_idx" ON "Announcement"("guildId", "pinned", "createdAt");

-- CreateIndex
CREATE INDEX "GuildSchedule_guildId_startsAt_idx" ON "GuildSchedule"("guildId", "startsAt");

-- CreateIndex
CREATE INDEX "DungeonGuide_guildId_dungeonKey_updatedAt_idx" ON "DungeonGuide"("guildId", "dungeonKey", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DungeonGuideMonster_guideId_position_key" ON "DungeonGuideMonster"("guideId", "position");

-- CreateIndex
CREATE INDEX "Homework_guildId_status_dueAt_idx" ON "Homework"("guildId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "HomeworkMonster_homeworkId_position_key" ON "HomeworkMonster"("homeworkId", "position");

-- CreateIndex
CREATE INDEX "Deck_guildId_combinationKey_idx" ON "Deck"("guildId", "combinationKey");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "GuildMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSchedule" ADD CONSTRAINT "GuildSchedule_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSchedule" ADD CONSTRAINT "GuildSchedule_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "GuildMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonGuide" ADD CONSTRAINT "DungeonGuide_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonGuide" ADD CONSTRAINT "DungeonGuide_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "GuildMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonGuideMonster" ADD CONSTRAINT "DungeonGuideMonster_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "DungeonGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "GuildMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkMonster" ADD CONSTRAINT "HomeworkMonster_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
