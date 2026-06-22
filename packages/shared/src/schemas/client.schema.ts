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
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
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
 */
export const UpsertClientProfileSchema = z.object({
  industry: z.string().optional(),
  businessDescription: z.string().optional(),
  targetAudience: z.string().optional(),
  budgetRangeMin: z.number().positive().optional(),
  budgetRangeMax: z.number().positive().optional(),
  communicationPreference: z
    .enum(["email", "whatsapp", "phone", "chat"])
    .optional(),
  preferredLanguage: z.string().optional(),
  timezone: z.string().optional(),
  preferredPlatforms: z.string().optional(),
  brandAssets: z
    .object({
      logoUrl: z.string().url().optional(),
      brandColors: z.array(z.string()).optional(),
      fonts: z.array(z.string()).optional(),
      guidelinesUrl: z.string().url().optional(),
    })
    .optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  website: z.string().url().optional().or(z.literal("")).optional(),
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  twitterHandle: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")).optional(),
  snapchatHandle: z.string().optional(),
  workingHours: z.string().optional(),
  decisionMakerName: z.string().optional(),
  decisionMakerPhone: z.string().optional(),
  painPoints: z.string().optional(),
});

export type UpsertClientProfileInput = z.infer<
  typeof UpsertClientProfileSchema
>;

/**
 * IntakeFormSchema — validates the new 4-section intake form
 */
export const IntakeFormSchema = z.object({
  // Section 1: Business Basics
  industry: z.string().min(2, "يرجى اختيار المجال").optional(),
  businessDescription: z
    .string()
    .min(50, "قصة النشاط يجب أن تكون 50 حرف على الأقل")
    .max(1000, "الوصف طويل جداً")
    .optional(),
  targetAudience: z.string().max(500).optional(),
  budgetRangeMin: z.number().positive().optional(),
  budgetRangeMax: z.number().positive().optional(),

  // Section 2: Marketing Goals
  campaignGoals: z.array(z.string()).min(1, "اختر هدف واحد على الأقل").optional(),
  campaignOffer: z.string().max(500).optional(),
  competitors: z.string().max(300).optional(),
  seasonalTiming: z.string().optional(),

  // Section 3: Customer Journey
  orderMethods: z.array(z.string()).optional(),
  abandonedCartSystem: z.boolean().optional().default(false),

  // Section 4: Creative & Brand Assets
  hasVisualIdentity: z.boolean().optional().default(false),
  brandAssets: z
    .object({
      logoUrl: z.string().url().optional(),
      brandColors: z.array(z.string()).optional(),
      fonts: z.array(z.string()).optional(),
      guidelinesUrl: z.string().url().optional(),
    })
    .optional(),
  visualReferences: z.string().max(300).optional(),
  uploadedFiles: z
    .array(
      z.object({
        key: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        size: z.number().optional(),
      })
    )
    .optional(),
});

export type IntakeFormInput = z.infer<typeof IntakeFormSchema>;
