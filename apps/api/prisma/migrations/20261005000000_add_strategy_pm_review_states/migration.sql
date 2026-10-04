ALTER TYPE "MarketingStrategyStatus" ADD VALUE IF NOT EXISTS 'PM_REVIEW';
ALTER TYPE "MarketingStrategyStatus" ADD VALUE IF NOT EXISTS 'PM_REVISION_REQUESTED';
ALTER TYPE "MarketingStrategyStatus" ADD VALUE IF NOT EXISTS 'CLIENT_REVIEW';
ALTER TYPE "MarketingStrategyStatus" ADD VALUE IF NOT EXISTS 'CLIENT_REVISION_REQUESTED';

-- Existing SENT strategies were already exposed to clients before PM review was introduced.
-- Keep them client-reviewable through the legacy-compatible SENT state.
