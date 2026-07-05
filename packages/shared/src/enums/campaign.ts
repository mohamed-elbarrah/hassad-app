export enum CampaignStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  STOPPED = "STOPPED",
  COMPLETED = "COMPLETED",
}

export enum CampaignPlatform {
  GOOGLE = "GOOGLE",
  META = "META",
  TIKTOK = "TIKTOK",
  SNAPCHAT = "SNAPCHAT",
}

export enum KpiSource {
  MANUAL = "manual",
  META_API = "meta_api",
  GOOGLE_API = "google_api",
  TIKTOK_API = "tiktok_api",
  SNAPCHAT_API = "snapchat_api",
}

export enum SyncStatus {
  PENDING = "PENDING",
  CONNECTED = "CONNECTED",
  SYNCING = "SYNCING",
  ERROR = "ERROR",
  DISCONNECTED = "DISCONNECTED",
}

export const CAMPAIGN_STATUS_AR: Record<CampaignStatus, string> = {
  PLANNING: "تخطيط",
  ACTIVE: "نشط",
  PAUSED: "متوقف",
  STOPPED: "متوقف",
  COMPLETED: "منتهي",
};
