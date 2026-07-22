-- Remove sample schedules that were recreated after a member had already deleted them.
-- Audit logs act as durable tombstones so future seed runs keep the deletion intact.
DELETE FROM "GuildSchedule" AS "schedule"
WHERE "schedule"."id" IN ('seed-schedule-siege', 'seed-schedule-lab')
  AND EXISTS (
    SELECT 1
    FROM "AuditLog" AS "log"
    WHERE "log"."guildId" = "schedule"."guildId"
      AND "log"."action" = 'GUILD_SCHEDULE_DELETED'
      AND "log"."entityType" = 'GuildSchedule'
      AND "log"."entityId" = "schedule"."id"
  );
