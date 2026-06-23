import { z } from "zod";
import {
  DisputeStatus,
  DisputeCategory,
  DisputePriority,
} from "../enums/dispute";

// ─── Enums ────────────────────────────────────────────────────────────────

export const disputeStatusSchema = z.nativeEnum(DisputeStatus);
export const disputeCategorySchema = z.nativeEnum(DisputeCategory);
export const disputePrioritySchema = z.nativeEnum(DisputePriority);

// ─── Create Dispute (Portal - Client) ──────────────────────────────────────

export const createDisputeSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  category: disputeCategorySchema,
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be at most 2000 characters"),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;

// ─── Dispute Message ───────────────────────────────────────────────────────

export const createDisputeMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(2000, "Message must be at most 2000 characters"),
  isInternal: z.boolean().optional().default(false), // Admin-only notes
});

export type CreateDisputeMessageInput = z.infer<
  typeof createDisputeMessageSchema
>;

// ─── Admin Approval ────────────────────────────────────────────────────────

export const approveDisputeSchema = z.object({
  priority: disputePrioritySchema.optional().default(DisputePriority.NORMAL),
  notes: z.string().max(500, "Notes must be at most 500 characters").optional(),
});

export type ApproveDisputeInput = z.infer<typeof approveDisputeSchema>;

// ─── Admin Rejection ───────────────────────────────────────────────────────

export const rejectDisputeSchema = z.object({
  reason: z
    .string()
    .min(10, "Rejection reason must be at least 10 characters")
    .max(500, "Rejection reason must be at most 500 characters"),
});

export type RejectDisputeInput = z.infer<typeof rejectDisputeSchema>;

// ─── Admin Close ────────────────────────────────────────────────────────────

export const closeDisputeSchema = z.object({
  resolution: z
    .string()
    .min(10, "Resolution must be at least 10 characters")
    .max(2000, "Resolution must be at most 2000 characters"),
});

export type CloseDisputeInput = z.infer<typeof closeDisputeSchema>;

// ─── Admin Change PM ────────────────────────────────────────────────────────

export const changePmSchema = z.object({
  newPmId: z.string().min(1, "New PM ID is required"),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export type ChangePmInput = z.infer<typeof changePmSchema>;

// ─── Dispute Filters (for list endpoints) ───────────────────────────────────

export const disputeFilterSchema = z.object({
  status: disputeStatusSchema.optional(),
  category: disputeCategorySchema.optional(),
  priority: disputePrioritySchema.optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  pmId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type DisputeFilterInput = z.infer<typeof disputeFilterSchema>;

// ─── PM Mark Resolved ───────────────────────────────────────────────────────

export const pmResolveDisputeSchema = z.object({
  message: z
    .string()
    .min(10, "Resolution message must be at least 10 characters")
    .max(1000, "Resolution message must be at most 1000 characters"),
});

export type PmResolveDisputeInput = z.infer<typeof pmResolveDisputeSchema>;

// ─── Client Confirm/Escalate ────────────────────────────────────────────────

export const clientConfirmSchema = z.object({
  confirmed: z.boolean(),
  feedback: z.string().max(500, "Feedback must be at most 500 characters").optional(),
});

export type ClientConfirmInput = z.infer<typeof clientConfirmSchema>;