-- Add V2 JSON fields to client_profile table
-- These fields mirror the IntakeFormV2 structure for unified data storage

ALTER TABLE "client_profile" ADD COLUMN "communication_info" JSONB;
ALTER TABLE "client_profile" ADD COLUMN "product_info" JSONB;
ALTER TABLE "client_profile" ADD COLUMN "audience_info" JSONB;
ALTER TABLE "client_profile" ADD COLUMN "brand_voice" JSONB;
ALTER TABLE "client_profile" ADD COLUMN "customer_journey" JSONB;
ALTER TABLE "client_profile" ADD COLUMN "campaign_info" JSONB;
ALTER TABLE "client_profile" ADD COLUMN "past_performance" JSONB;
ALTER TABLE "client_profile" ADD COLUMN "budget_info" JSONB;
ALTER TABLE "client_profile" ADD COLUMN "visual_identity_info" JSONB;

-- Migrate existing data from portal_intake_forms to client_profile
-- This ensures clients who already submitted intake forms have their data in profile
UPDATE "client_profile" cp
SET 
  "communication_info" = pif."communication_info",
  "product_info" = pif."product_info",
  "audience_info" = pif."audience_info",
  "brand_voice" = pif."brand_voice",
  "customer_journey" = pif."customer_journey",
  "campaign_info" = pif."campaign_info",
  "past_performance" = pif."past_performance",
  "budget_info" = pif."budget_info",
  "visual_identity_info" = pif."visual_identity_info"
FROM "portal_intake_forms" pif
WHERE cp."client_id" = pif."client_id"
  AND pif."is_submitted" = true;