import { CampaignStatus, CampaignPlatform } from "@hassad/shared";

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  [CampaignStatus.PLANNING]: "تخطيط",
  [CampaignStatus.ACTIVE]: "نشطة",
  [CampaignStatus.PAUSED]: "متوقفة",
  [CampaignStatus.STOPPED]: "منتهية",
  [CampaignStatus.COMPLETED]: "مكتملة",
};

export const CAMPAIGN_STATUS_BADGE: Record<string, string> = {
  [CampaignStatus.PLANNING]: "PENDING",
  [CampaignStatus.ACTIVE]: "ACTIVE",
  [CampaignStatus.PAUSED]: "WARNING",
  [CampaignStatus.STOPPED]: "DANGER",
  [CampaignStatus.COMPLETED]: "COMPLETED",
};

export const PLATFORM_LABELS: Record<string, string> = {
  [CampaignPlatform.GOOGLE]: "Google Ads",
  [CampaignPlatform.META]: "Meta Ads",
  [CampaignPlatform.TIKTOK]: "TikTok Ads",
  [CampaignPlatform.SNAPCHAT]: "Snapchat Ads",
};

export const PLATFORM_COLORS: Record<string, string> = {
  [CampaignPlatform.GOOGLE]: "#4285F4",
  [CampaignPlatform.META]: "#0668E1",
  [CampaignPlatform.TIKTOK]: "#000000",
  [CampaignPlatform.SNAPCHAT]: "#FFFC00",
};

export const PLATFORM_BG_COLORS: Record<string, string> = {
  [CampaignPlatform.GOOGLE]: "bg-blue-500",
  [CampaignPlatform.META]: "bg-indigo-500",
  [CampaignPlatform.TIKTOK]: "bg-neutral-800",
  [CampaignPlatform.SNAPCHAT]: "bg-yellow-400",
};

export const PLATFORM_ICON_BG: Record<string, string> = {
  [CampaignPlatform.GOOGLE]: "bg-blue-50 text-blue-600",
  [CampaignPlatform.META]: "bg-indigo-50 text-indigo-600",
  [CampaignPlatform.TIKTOK]: "bg-neutral-100 text-neutral-700",
  [CampaignPlatform.SNAPCHAT]: "bg-yellow-50 text-yellow-700",
};

export const PLATFORM_DOT: Record<string, string> = {
  [CampaignPlatform.GOOGLE]: "bg-blue-500",
  [CampaignPlatform.META]: "bg-indigo-500",
  [CampaignPlatform.TIKTOK]: "bg-neutral-800",
  [CampaignPlatform.SNAPCHAT]: "bg-yellow-400",
};

/**
 * Display label for a campaign platform — falls back to the raw
 * value if unknown. Co-located with PLATFORM_LABELS so callers
 * importing the labels also get the lookup helper.
 */
export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

/**
 * Compute derived metrics from raw campaign data.
 * Expects `analytics` object (from API response) or flat fields.
 */
export function computeCampaignMetrics(c: {
  budgetSpent: number;
  analytics?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    revenue?: number;
  };
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
}) {
  const analytics = c.analytics ?? {};
  const budgetSpent = Number(c.budgetSpent ?? 0);
  const revenue = Number(analytics.revenue ?? c.revenue ?? 0);
  const impressions = Number(analytics.impressions ?? c.impressions ?? 0);
  const clicks = Number(analytics.clicks ?? c.clicks ?? 0);
  const conversions = Number(analytics.conversions ?? c.conversions ?? 0);

  const roas = budgetSpent > 0 ? revenue / budgetSpent : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? budgetSpent / clicks : 0;
  const cpa = conversions > 0 ? budgetSpent / conversions : 0;
  const convRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const cpm = impressions > 0 ? (budgetSpent / impressions) * 1000 : 0;
  const profit = revenue - budgetSpent;

  return {
    roas,
    ctr,
    cpc,
    cpa,
    convRate,
    cpm,
    profit,
    budgetSpent,
    revenue,
    impressions,
    clicks,
    conversions,
  };
}
