import { z } from "zod";
import { CampaignPlatform, CampaignStatus } from "../enums/campaign";

export const CreateCampaignSchema = z.object({
  taskId: z.string().uuid(),
  clientId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  name: z.string().min(3),
  platform: z.nativeEnum(CampaignPlatform),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional(),
  budgetTotal: z.number().min(0).default(0),
});

export const UpdateCampaignMetricsSchema = z.object({
  budgetSpent: z.number().min(0).optional(),
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  revenue: z.number().min(0).optional(),
});

export const UpdateCampaignStatusSchema = z.object({
  status: z.nativeEnum(CampaignStatus),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignMetricsInput = z.infer<typeof UpdateCampaignMetricsSchema>;
export type UpdateCampaignStatusInput = z.infer<typeof UpdateCampaignStatusSchema>;
