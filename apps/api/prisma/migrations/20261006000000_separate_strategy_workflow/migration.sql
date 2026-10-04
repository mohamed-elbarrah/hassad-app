ALTER TABLE "marketing_strategies"
  ADD COLUMN "is_visible_to_client" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "submitted_at" TIMESTAMP(3),
  ADD COLUMN "pm_reviewed_by" TEXT,
  ADD COLUMN "pm_reviewed_at" TIMESTAMP(3);

CREATE TABLE "marketing_strategy_review_history" (
  "id" TEXT NOT NULL,
  "strategy_id" TEXT NOT NULL,
  "from_status" "MarketingStrategyStatus",
  "to_status" "MarketingStrategyStatus" NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_role" TEXT NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketing_strategy_review_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketing_strategy_review_history_strategy_id_created_at_idx"
  ON "marketing_strategy_review_history" ("strategy_id", "created_at");

ALTER TABLE "marketing_strategies"
  ADD CONSTRAINT "marketing_strategies_pm_reviewed_by_fkey"
  FOREIGN KEY ("pm_reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "marketing_strategy_review_history"
  ADD CONSTRAINT "marketing_strategy_review_history_strategy_id_fkey"
  FOREIGN KEY ("strategy_id") REFERENCES "marketing_strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "marketing_strategy_review_history_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing SENT strategies were already client-visible before this field existed.
UPDATE "marketing_strategies"
SET "is_visible_to_client" = true
WHERE "status" IN (
  'SENT'::"MarketingStrategyStatus",
  'CLIENT_REVIEW'::"MarketingStrategyStatus",
  'APPROVED'::"MarketingStrategyStatus"
);
