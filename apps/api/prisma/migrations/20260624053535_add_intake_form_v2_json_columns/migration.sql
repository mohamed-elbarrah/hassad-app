-- AlterTable
ALTER TABLE "portal_intake_forms" ADD COLUMN     "audience_info" JSONB,
ADD COLUMN     "brand_voice" JSONB,
ADD COLUMN     "budget_info" JSONB,
ADD COLUMN     "campaign_info" JSONB,
ADD COLUMN     "communication_info" JSONB,
ADD COLUMN     "current_step" INTEGER DEFAULT 0,
ADD COLUMN     "customer_journey" JSONB,
ADD COLUMN     "past_performance" JSONB,
ADD COLUMN     "product_info" JSONB,
ADD COLUMN     "visual_identity_info" JSONB;
