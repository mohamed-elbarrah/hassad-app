import { z } from "zod";
import { ClientStatus, BusinessType } from "../enums/client";

/**
 * CreateClientSchema — validates the input required to create a new client directly.
 * Matches the DB `Client` model's writable fields.
 */
export const CreateClientSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .optional(),
  contactName: z
    .string()
    .min(2, "Contact name must be at least 2 characters")
    .optional(),
  phoneWhatsapp: z
    .string()
    .min(5, "Phone must be at least 5 characters")
    .optional(),
  email: z.string().email("Invalid email address").optional().nullable(),
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .optional(),
  businessType: z.nativeEnum(BusinessType).optional(),
  accountManager: z.string().uuid("Invalid user ID format").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
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

/**
 * UpsertClientProfileSchema — validates profile upsert input.
 * Matches the IntakeForm fields for consistency.
 */
export const UpsertClientProfileSchema = z.object({
  // Section 1: Business Basics
  industry: z.string().optional(),
  businessDescription: z.string().optional(),
  targetAudience: z.string().optional(),
  budgetRangeMin: z.number().positive().optional(),
  budgetRangeMax: z.number().positive().optional(),

  // Section 2: Marketing Goals
  campaignGoals: z.array(z.string()).optional(),
  campaignOffer: z.string().optional(),
  competitors: z.string().optional(),
  seasonalTiming: z.string().optional(),

  // Section 3: Customer Journey
  orderMethods: z.array(z.string()).optional(),
  abandonedCartSystem: z.boolean().optional(),

  // Section 4: Creative & Brand Assets
  hasVisualIdentity: z.boolean().optional(),
  brandAssets: z
    .object({
      logoUrl: z.string().optional(),
      brandColors: z.array(z.string()).optional(),
      fonts: z.array(z.string()).optional(),
      guidelinesUrl: z.string().optional(),
    })
    .optional(),
  visualReferences: z.string().optional(),
  uploadedFiles: z
    .array(
      z.object({
        key: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        size: z.number().optional(),
      }),
    )
    .optional(),
});

export type UpsertClientProfileInput = z.infer<
  typeof UpsertClientProfileSchema
>;

/**
 * IntakeFormSchema — validates the 4-section intake form
 * This is the source of truth for all intake-related forms.
 */
export const IntakeFormSchema = z.object({
  // Section 1: Business Basics
  industry: z.string().optional(),
  businessDescription: z.string().optional(),
  targetAudience: z.string().optional(),
  budgetRangeMin: z.number().positive().optional(),
  budgetRangeMax: z.number().positive().optional(),

  // Section 2: Marketing Goals
  campaignGoals: z.array(z.string()).optional(),
  campaignOffer: z.string().optional(),
  competitors: z.string().optional(),
  seasonalTiming: z.string().optional(),

  // Section 3: Customer Journey
  orderMethods: z.array(z.string()).optional(),
  abandonedCartSystem: z.boolean().optional(),

  // Section 4: Creative & Brand Assets
  hasVisualIdentity: z.boolean().optional(),
  brandAssets: z
    .object({
      logoUrl: z.string().optional(),
      brandColors: z.array(z.string()).optional(),
      fonts: z.array(z.string()).optional(),
      guidelinesUrl: z.string().optional(),
    })
    .optional(),
  visualReferences: z.string().optional(),
  uploadedFiles: z
    .array(
      z.object({
        key: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        size: z.number().optional(),
      }),
    )
    .optional(),
});

export type IntakeFormInput = z.infer<typeof IntakeFormSchema>;
