-- Add new intake form columns to client_profile (if not exist)
ALTER TABLE "client_profile" ADD COLUMN IF NOT EXISTS "campaign_goals" JSONB;
ALTER TABLE "client_profile" ADD COLUMN IF NOT EXISTS "campaign_offer" TEXT;
ALTER TABLE "client_profile" ADD COLUMN IF NOT EXISTS "competitors" TEXT;
ALTER TABLE "client_profile" ADD COLUMN IF NOT EXISTS "seasonal_timing" TEXT;
ALTER TABLE "client_profile" ADD COLUMN IF NOT EXISTS "order_methods" JSONB;
ALTER TABLE "client_profile" ADD COLUMN IF NOT EXISTS "abandoned_cart_system" BOOLEAN DEFAULT false;
ALTER TABLE "client_profile" ADD COLUMN IF NOT EXISTS "has_visual_identity" BOOLEAN DEFAULT false;
ALTER TABLE "client_profile" ADD COLUMN IF NOT EXISTS "visual_references" TEXT;
ALTER TABLE "client_profile" ADD COLUMN IF NOT EXISTS "uploaded_files" JSONB;

-- Remove old profile columns (if exist)
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "communication_preference";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "preferred_language";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "timezone";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "preferred_platforms";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "custom_fields";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "website";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "instagram_handle";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "tiktok_handle";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "twitter_handle";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "linkedin_url";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "snapchat_handle";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "working_hours";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "decision_maker_name";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "decision_maker_phone";
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "pain_points";