import { z } from "zod";
import { PaymentMethod, PaymentGatewayType, PaymentStatus } from "../enums/finance";

export const CreatePaymentGatewaySchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(PaymentGatewayType),
  isActive: z.boolean().optional(),
  configJson: z.any().optional(),
});

export const UpdatePaymentGatewaySchema = CreatePaymentGatewaySchema.partial();

export const CreateBankAccountSchema = z.object({
  accountName: z.string().min(1),
  iban: z.string().min(1),
  bankName: z.string().min(1),
  swiftCode: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const UpdateBankAccountSchema = CreateBankAccountSchema.partial();

export const CreatePaymentIntentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default("SAR"),
});

export const ManualPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
});
