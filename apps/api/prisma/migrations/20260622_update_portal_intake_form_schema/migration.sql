-- AlterTable
ALTER TABLE "portal_intake_forms" ADD COLUMN "industry" TEXT;
ALTER TABLE "portal_intake_forms" ADD COLUMN "target_audience" TEXT;
ALTER TABLE "portal_intake_forms" ADD COLUMN "budget_range_min" DOUBLE PRECISION;
ALTER TABLE "portal_intake_forms" ADD COLUMN "budget_range_max" DOUBLE PRECISION;
ALTER TABLE "portal_intake_forms" ADD COLUMN "campaign_goals" JSONB;
ALTER TABLE "portal_intake_forms" ADD COLUMN "campaign_offer" TEXT;
ALTER TABLE "portal_intake_forms" ADD COLUMN "competitors" TEXT;
ALTER TABLE "portal_intake_forms" ADD COLUMN "seasonal_timing" TEXT;
ALTER TABLE "portal_intake_forms" ADD COLUMN "order_methods" JSONB;
ALTER TABLE "portal_intake_forms" ADD COLUMN "abandoned_cart_system" BOOLEAN DEFAULT false;
ALTER TABLE "portal_intake_forms" ADD COLUMN "has_visual_identity" BOOLEAN DEFAULT false;
ALTER TABLE "portal_intake_forms" ADD COLUMN "brand_assets" JSONB;
ALTER TABLE "portal_intake_forms" ADD COLUMN "visual_references" TEXT;
ALTER TABLE "portal_intake_forms" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "portal_intake_forms_client_id_key" ON "portal_intake_forms"("client_id");
