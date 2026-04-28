import { z } from "zod";
import { ProposalStatus } from "../enums/client";

export const CreateProposalSchema = z.object({
  leadId: z.string().uuid("Invalid lead ID format"),
  title: z.string().min(1, "Title is required"),
  serviceDescription: z.string().min(1, "Service description is required"),
  servicesList: z.array(z.unknown()).min(1, "At least one service is required"),
  totalPrice: z.number().positive("Price must be greater than zero"),
  durationDays: z.number().int().positive("Duration must be a positive integer"),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
});

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;

export const UpdateProposalSchema = z
  .object({
    title: z.string().min(1).optional(),
    serviceDescription: z.string().min(1).optional(),
    servicesList: z.array(z.unknown()).min(1).optional(),
    totalPrice: z.number().positive().optional(),
    durationDays: z.number().int().positive().optional(),
    platforms: z.array(z.string()).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateProposalInput = z.infer<typeof UpdateProposalSchema>;

export const ProposalResponseSchema = z.object({
  notes: z.string().optional().nullable(),
});

export type ProposalResponseInput = z.infer<typeof ProposalResponseSchema>;
