-- CreateEnum
CREATE TYPE "DeckType" AS ENUM ('SIEGE_OFFENSE', 'SIEGE_DEFENSE');

-- CreateEnum
CREATE TYPE "DeckStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "DeckType" NOT NULL,
    "status" "DeckStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT '',
    "minimumRequirements" TEXT NOT NULL DEFAULT '',
    "caution" TEXT NOT NULL DEFAULT '',
    "combinationKey" TEXT,
    "targetDefenseId" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckMonster" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DeckMonster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deck_guildId_type_status_updatedAt_idx" ON "Deck"("guildId", "type", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Deck_targetDefenseId_status_idx" ON "Deck"("targetDefenseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Deck_guildId_combinationKey_key" ON "Deck"("guildId", "combinationKey");

-- CreateIndex
CREATE INDEX "DeckMonster_monsterId_idx" ON "DeckMonster"("monsterId");

-- CreateIndex
CREATE UNIQUE INDEX "DeckMonster_deckId_position_key" ON "DeckMonster"("deckId", "position");

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "GuildMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_targetDefenseId_fkey" FOREIGN KEY ("targetDefenseId") REFERENCES "Deck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckMonster" ADD CONSTRAINT "DeckMonster_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
