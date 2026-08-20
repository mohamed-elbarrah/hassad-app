CREATE TYPE "InitialPaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED');

ALTER TABLE "contracts"
  ADD COLUMN "initial_payment_required" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "initial_payment_status" "InitialPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "initial_payment_amount" DOUBLE PRECISION;

-- Existing one-time contracts are migrated to fixed projects.
ALTER TYPE "ContractType" RENAME TO "ContractType_old";
CREATE TYPE "ContractType" AS ENUM ('MONTHLY_RETAINER', 'FIXED_PROJECT');
ALTER TABLE "contracts"
  ALTER COLUMN "type" TYPE "ContractType"
  USING CASE WHEN "type"::text = 'MONTHLY_RETAINER' THEN 'MONTHLY_RETAINER'::"ContractType" ELSE 'FIXED_PROJECT'::"ContractType" END;
DROP TYPE "ContractType_old";
