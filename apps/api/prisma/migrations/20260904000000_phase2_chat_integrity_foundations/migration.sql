-- Phase 2 chat integrity foundations.
-- All changes are additive: existing chat rows are preserved.

ALTER TABLE "conversation_participants"
ADD COLUMN "last_read_at" TIMESTAMP(3);

-- Do not silently discard legacy participant rows. If this preflight fails,
-- resolve duplicates in a reviewed data migration before retrying this migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "conversation_participants"
    GROUP BY "conversation_id", "user_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'CHAT_PARTICIPANT_DUPLICATES_REQUIRE_REVIEW';
  END IF;
END $$;

CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key"
ON "conversation_participants"("conversation_id", "user_id");

CREATE INDEX "conversation_participants_user_id_conversation_id_idx"
ON "conversation_participants"("user_id", "conversation_id");

CREATE INDEX "conversations_type_is_active_updated_at_idx"
ON "conversations"("type", "is_active", "updated_at");

CREATE INDEX "messages_conversation_id_created_at_id_idx"
ON "messages"("conversation_id", "created_at", "id");
