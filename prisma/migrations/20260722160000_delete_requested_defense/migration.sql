-- Delete the requested 물이누 · 불라클 · 풍그리 defense from every guild where it exists.
WITH "requested_defenses" AS (
  SELECT "deck"."id", "deck"."guildId", "deck"."title"
  FROM "Deck" AS "deck"
  WHERE "deck"."type" = 'SIEGE_DEFENSE'
    AND "deck"."deletedAt" IS NULL
    AND (
      "deck"."combinationKey" = '1105:2013:3012'
      OR "deck"."id" IN (
        SELECT "monster"."deckId"
        FROM "DeckMonster" AS "monster"
        GROUP BY "monster"."deckId"
        HAVING COUNT(*) = 3
          AND COUNT(DISTINCT "monster"."monsterId") = 3
          AND COUNT(*) FILTER (WHERE "monster"."monsterId" IN ('1105', '2013', '3012')) = 3
      )
    )
)
INSERT INTO "AuditLog" ("id", "guildId", "action", "entityType", "entityId", "metadata", "createdAt")
SELECT 'requested-defense-delete-' || "id", "guildId", 'DEFENSE_DECK_DELETED', 'Deck', "id",
  jsonb_build_object('title', "title", 'monsterIds', ARRAY['2013', '1105', '3012'], 'source', 'owner-request'), CURRENT_TIMESTAMP
FROM "requested_defenses"
ON CONFLICT ("id") DO NOTHING;

UPDATE "Deck" AS "deck"
SET "deletedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
WHERE "deck"."type" = 'SIEGE_DEFENSE'
  AND "deck"."deletedAt" IS NULL
  AND (
    "deck"."combinationKey" = '1105:2013:3012'
    OR "deck"."id" IN (
      SELECT "monster"."deckId"
      FROM "DeckMonster" AS "monster"
      GROUP BY "monster"."deckId"
      HAVING COUNT(*) = 3
        AND COUNT(DISTINCT "monster"."monsterId") = 3
        AND COUNT(*) FILTER (WHERE "monster"."monsterId" IN ('1105', '2013', '3012')) = 3
    )
  );
