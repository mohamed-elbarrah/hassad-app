import { z } from "zod";
import { ContractType } from "../enums/client";

export const CreateContractSchema = z.object({
  clientId: z.string().uuid("Invalid client ID format"),
  proposalId: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(ContractType),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  monthlyValue: z.number().nonnegative("Monthly value must be zero or greater"),
  totalValue: z.number().positive("Total value must be greater than zero"),
  filePath: z.string().optional().nullable(),
});

export type CreateContractInput = z.infer<typeof CreateContractSchema>;

export const UpdateContractSchema = z
  .object({
    title: z.string().min(1).optional(),
    startDate: z.string().min(1).optional(),
    endDate: z.string().min(1).optional(),
    monthlyValue: z.number().nonnegative().optional(),
    totalValue: z.number().positive().optional(),
    filePath: z.string().optional().nullable(),
  })
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
