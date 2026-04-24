import { z } from "zod";
import { ProposalStatus } from "../enums/client";

export const CreateProposalSchema = z.object({
  clientId: z.string().cuid("Invalid client ID format"),
  services: z
    .array(z.string().min(1, "Service name is required"))
    .min(1, "At least one service is required"),
  price: z.number().positive("Price must be greater than zero"),
  startDate: z.string().min(1, "Start date is required"),
  notes: z.string().optional().nullable(),
});

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;

export const UpdateProposalSchema = z
  .object({
    services: z
      .array(z.string().min(1, "Service name is required"))
      .min(1, "At least one service is required")
      .optional(),
    price: z.number().positive("Price must be greater than zero").optional(),
    startDate: z.string().min(1, "Start date is required").optional(),
    notes: z.string().optional().nullable(),
    status: z.nativeEnum(ProposalStatus).optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateProposalInput = z.infer<typeof UpdateProposalSchema>;

export const ProposalResponseSchema = z.object({
  notes: z.string().optional().nullable(),
});

export type ProposalResponseInput = z.infer<typeof ProposalResponseSchema>;
