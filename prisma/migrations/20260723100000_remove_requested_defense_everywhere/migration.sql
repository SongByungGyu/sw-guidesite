-- Remove the requested 물이누 · 불라클 · 풍그리 combination from active decks
-- and from the recent meta ranking records that can surface it independently.
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

DELETE FROM "DefenseMetaRecord"
WHERE "combinationKey" = '1105:2013:3012'
   OR (
     cardinality("monsterIds") = 3
     AND "monsterIds" @> ARRAY['1105', '2013', '3012']::TEXT[]
   );
