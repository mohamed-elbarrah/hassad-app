import { CampaignPlatform, CampaignStatus } from "@hassad/shared";
import type { StatusTone } from "@/components/patterns/status-badge";

const statusLabels: Record<CampaignStatus, string> = { PLANNING: "Planning", ACTIVE: "Active", PAUSED: "Paused", STOPPED: "Stopped", COMPLETED: "Completed" };
const platformLabels: Record<CampaignPlatform, string> = { GOOGLE: "Google", META: "Meta", TIKTOK: "TikTok", SNAPCHAT: "Snapchat" };
export function formatCampaignStatus(value: CampaignStatus) { return statusLabels[value]; }
export function formatCampaignPlatform(value: CampaignPlatform) { return platformLabels[value]; }
export function getCampaignStatusTone(value: CampaignStatus): StatusTone { if (value === CampaignStatus.ACTIVE) return "success"; if (value === CampaignStatus.PAUSED) return "warning"; if (value === CampaignStatus.STOPPED) return "destructive"; if (value === CampaignStatus.COMPLETED) return "neutral"; return "attention"; }
