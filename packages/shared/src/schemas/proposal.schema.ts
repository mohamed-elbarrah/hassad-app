import { z } from "zod";
import { ProposalStatus, DurationUnit } from "../enums/client";

export const ServiceItemSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  price: z.number().positive("Price must be positive"),
  description: z.string().optional(),
});

export type ServiceItem = z.infer<typeof ServiceItemSchema>;

export const CreateProposalSchema = z.object({
  requestId: z.string().uuid("Invalid request ID format"),
  title: z.string().min(1, "Title is required"),
  serviceDescription: z.string().min(1, "Service description is required"),
  servicesList: z
    .array(ServiceItemSchema)
    .min(1, "At least one service is required"),
  totalPrice: z.number().positive("Price must be greater than zero"),
  durationDays: z
    .number()
    .int()
    .positive("Duration must be a positive integer"),
  durationUnit: z.nativeEnum(DurationUnit).default(DurationUnit.DAYS),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  startDate: z.string().optional(),
  offerValidityDays: z.number().int().positive().default(30),
});

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;

export const UpdateProposalSchema = z
  .object({
    title: z.string().min(1).optional(),
    serviceDescription: z.string().min(1).optional(),
    servicesList: z.array(ServiceItemSchema).min(1).optional(),
    totalPrice: z.number().positive().optional(),
    durationDays: z.number().int().positive().optional(),
    durationUnit: z.nativeEnum(DurationUnit).optional(),
    platforms: z.array(z.string()).min(1).optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    startDate: z.string().optional(),
    offerValidityDays: z.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateProposalInput = z.infer<typeof UpdateProposalSchema>;

export const ProposalResponseSchema = z.object({
  notes: z.string().optional().nullable(),
});

export type ProposalResponseInput = z.infer<typeof ProposalResponseSchema>;
