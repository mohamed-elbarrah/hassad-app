import { z } from "zod";
import { ClientStatus, BusinessType } from "../enums/client";

/**
 * CreateClientSchema — validates the input required to create a new client directly.
 * Matches the DB `Client` model's writable fields.
 */
export const CreateClientSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  phoneWhatsapp: z.string().min(5, "Phone must be at least 5 characters"),
  email: z.string().email("Invalid email address").optional().nullable(),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.nativeEnum(BusinessType),
  accountManager: z.string().uuid("Invalid user ID format").optional(),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;

/**
 * UpdateClientSchema — validates partial updates to an existing client.
 */
export const UpdateClientSchema = z
  .object({
    companyName: z.string().min(2).optional(),
    contactName: z.string().min(2).optional(),
    phoneWhatsapp: z.string().min(5).optional(),
    email: z.string().email().optional().nullable(),
    businessName: z.string().min(2).optional(),
    businessType: z.nativeEnum(BusinessType).optional(),
    accountManager: z.string().uuid().optional(),
    status: z.nativeEnum(ClientStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
