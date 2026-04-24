import { z } from "zod";
import { ContractStatus } from "../enums/client";

export const CreateContractSchema = z.object({
  clientId: z.string().cuid("Invalid client ID format"),
  services: z
    .array(z.string().min(1, "Service name is required"))
    .min(1, "At least one service is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  value: z.number().positive("Value must be greater than zero"),
  fileUrl: z.string().url("Invalid file URL").optional().nullable(),
});

export type CreateContractInput = z.infer<typeof CreateContractSchema>;

export const UpdateContractSchema = z
  .object({
    services: z
      .array(z.string().min(1, "Service name is required"))
      .min(1, "At least one service is required")
      .optional(),
    startDate: z.string().min(1, "Start date is required").optional(),
    endDate: z.string().min(1, "End date is required").optional(),
    value: z.number().positive("Value must be greater than zero").optional(),
    fileUrl: z.string().url("Invalid file URL").optional().nullable(),
    status: z.nativeEnum(ContractStatus).optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateContractInput = z.infer<typeof UpdateContractSchema>;

export const SignContractSchema = z.object({
  signedByName: z.string().min(2, "Signer name is required"),
  signedByEmail: z.string().email("Invalid email").optional().nullable(),
  signatureUrl: z.string().url("Invalid signature URL").optional().nullable(),
});

export type SignContractInput = z.infer<typeof SignContractSchema>;
