-- Project chat membership provenance and soft-disable state.
-- Legacy rows are intentionally classified as MANUAL: provenance cannot be
-- reconstructed safely, so this migration must not remove an existing member.
CREATE TYPE "ConversationParticipantSource" AS ENUM ('AUTO', 'MANUAL');

ALTER TABLE "conversation_participants"
  ADD COLUMN "source" "ConversationParticipantSource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- Preflight: retain the migration's non-destructive guarantee if the table is
-- unexpectedly malformed. The defaults above preserve every existing row.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "conversation_participants" cp
    LEFT JOIN "conversations" c ON c."id" = cp."conversation_id"
    WHERE c."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'CHAT_PARTICIPANT_ORPHANS_REQUIRE_REVIEW';
  END IF;
END $$;

CREATE INDEX "conversation_participants_conversation_id_is_active_idx"
  ON "conversation_participants"("conversation_id", "is_active");
CREATE INDEX "conversation_participants_user_id_is_active_idx"
  ON "conversation_participants"("user_id", "is_active");
