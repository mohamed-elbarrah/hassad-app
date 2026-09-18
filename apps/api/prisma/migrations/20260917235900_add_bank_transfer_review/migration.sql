-- Add an explicit rejected state and reviewer metadata for manual bank transfers.
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "PaymentEventType" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "payments"
  ADD COLUMN "reviewed_by" TEXT,
  ADD COLUMN "reviewed_at" TIMESTAMP(3),
  ADD COLUMN "review_reason" TEXT;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "payments_reviewed_by_idx" ON "payments"("reviewed_by");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "payments"
    WHERE "method" = 'BANK_TRANSFER' AND "status" = 'PENDING'
    GROUP BY "invoice_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'BANK_TRANSFER_PENDING_DUPLICATES_REQUIRE_REVIEW';
  END IF;
END
$$;

-- A client may have only one active bank-transfer submission per invoice.
-- This also protects the invariant under concurrent submissions.
CREATE UNIQUE INDEX "payments_one_pending_bank_per_invoice_idx"
  ON "payments"("invoice_id")
  WHERE "method" = 'BANK_TRANSFER' AND "status" = 'PENDING';
