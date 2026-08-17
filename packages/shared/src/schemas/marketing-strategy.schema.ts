import { z } from "zod";
import { MarketingStrategyStatus } from "../enums/project";

export const SendMarketingStrategySchema = z.object({});

export const ClientApproveStrategySchema = z.object({
  notes: z.string().optional(),
});

export const ClientRequestRevisionSchema = z.object({
  comment: z.string().min(1, "Comment is required"),
});

export const MarketingStrategyQuerySchema = z.object({
  status: z.nativeEnum(MarketingStrategyStatus).optional(),
  taskId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type SendMarketingStrategyInput = z.infer<
  typeof SendMarketingStrategySchema
>;
export type ClientApproveStrategyInput = z.infer<
  typeof ClientApproveStrategySchema
>;
export type ClientRequestRevisionInput = z.infer<
  typeof ClientRequestRevisionSchema
>;
export type MarketingStrategyQueryInput = z.infer<
  typeof MarketingStrategyQuerySchema
>;
