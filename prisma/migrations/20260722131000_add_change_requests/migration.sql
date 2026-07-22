CREATE TABLE "ChangeRequest" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChangeRequest_guildId_status_createdAt_idx" ON "ChangeRequest"("guildId", "status", "createdAt");
CREATE INDEX "ChangeRequest_authorId_createdAt_idx" ON "ChangeRequest"("authorId", "createdAt");

ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "GuildMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
