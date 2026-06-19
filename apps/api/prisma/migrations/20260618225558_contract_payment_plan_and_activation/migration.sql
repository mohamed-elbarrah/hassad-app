-- CreateEnum
CREATE TYPE "PaymentPlanTriggerType" AS ENUM ('ON_SIGN', 'PERIOD_END', 'MILESTONE', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentAmountType" AS ENUM ('PERCENT', 'FIXED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContractStatus" ADD VALUE 'ON_HOLD';
ALTER TYPE "ContractStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'PENDING_ACTIVATION';

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "down_payment_type" "PaymentAmountType",
ADD COLUMN     "down_payment_value" DOUBLE PRECISION,
ADD COLUMN     "number_of_months" INTEGER;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "payment_plan_id" TEXT;

-- CreateTable
CREATE TABLE "contract_payment_plans" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "trigger_type" "PaymentPlanTriggerType" NOT NULL,
    "amount_type" "PaymentAmountType" NOT NULL,
    "amount_value" DOUBLE PRECISION NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "due_offset_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_payment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_status_history" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "from_status" "ContractStatus" NOT NULL,
    "to_status" "ContractStatus" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_payment_plans_contract_id_idx" ON "contract_payment_plans"("contract_id");

-- CreateIndex
CREATE INDEX "contract_payment_plans_trigger_type_idx" ON "contract_payment_plans"("trigger_type");

-- CreateIndex
CREATE INDEX "contract_status_history_contract_id_idx" ON "contract_status_history"("contract_id");

-- CreateIndex
CREATE INDEX "contract_status_history_to_status_idx" ON "contract_status_history"("to_status");

-- CreateIndex
CREATE INDEX "invoices_payment_plan_id_idx" ON "invoices"("payment_plan_id");

-- AddForeignKey
ALTER TABLE "contract_payment_plans" ADD CONSTRAINT "contract_payment_plans_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_status_history" ADD CONSTRAINT "contract_status_history_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_status_history" ADD CONSTRAINT "contract_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_plan_id_fkey" FOREIGN KEY ("payment_plan_id") REFERENCES "contract_payment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
