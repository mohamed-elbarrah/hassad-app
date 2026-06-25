import { z } from "zod";

// ── Section schemas ───────────────────────────────────────────

export const CommunicationInfoSchema = z.object({
  contactName: z.string().min(2, "اسم يجب أن يكون 2 أحرف على الأقل"),
  businessName: z.string().min(2, "اسم النشاط يجب أن يكون 2 أحرف على الأقل"),
  industry: z.string().min(1, "مجال النشاط مطلوب"),
  contactNumber: z.string().min(5, "رقم التواصل يجب أن يكون 5 أحرف على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

export const ProductInfoSchema = z.object({
  productStory: z.string().optional(),
  detailedDescription: z.string().optional(),
  valueProposition: z.string().optional(),
  advantages: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  contentDirection: z.string().optional(),
});

export const FaqPairSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const AudienceInfoSchema = z.object({
  customerAnalysis: z.string().optional(),
  faq: z.array(FaqPairSchema).optional(),
});

export const BrandVoiceSchema = z.object({
  toneOfVoice: z.string().optional(),
  boundaries: z.string().optional(),
  verbalSlogan: z.string().optional(),
  appearanceMethod: z.string().optional(),
});

export const CustomerJourneySchema = z.object({
  orderMethods: z.array(z.string()).optional(),
  followUpTools: z.string().optional(),
});

export const CampaignInfoSchema = z.object({
  campaignGoal: z.string().optional(),
  campaignDetails: z.string().optional(),
  campaignOffer: z.string().optional(),
  guarantees: z.string().optional(),
  campaignSeason: z.string().optional(),
  competitors: z.string().optional(),
});

export const PastPerformanceSchema = z.object({
  bestCampaigns: z.string().optional(),
  pastPerformance: z.string().optional(),
  trackingSetup: z.string().optional(),
});

export const BudgetInfoSchema = z.object({
  budgetRange: z.number().positive().optional(),
  previousReports: z.array(z.string()).optional(),
});

export const VisualIdentityInfoSchema = z.object({
  hasVisualIdentity: z.boolean().optional(),
  brandAssets: z.object({
    logoUrl: z.string().optional(),
    brandColors: z.array(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
    guidelinesUrl: z.string().optional(),
  }).optional(),
  pastDesigns: z.string().optional(),
  productPhotos: z.array(z.string()).optional(),
  visualDirection: z.array(z.string()).max(3).optional(),
});

// ── Combined schema ───────────────────────────────────────────

export const IntakeFormV2Schema = z.object({
  currentStep: z.number().int().min(0).max(7).optional(),
  communicationInfo: CommunicationInfoSchema.optional(),
  productInfo: ProductInfoSchema.optional(),
  audienceInfo: AudienceInfoSchema.optional(),
  brandVoice: BrandVoiceSchema.optional(),
  customerJourney: CustomerJourneySchema.optional(),
  campaignInfo: CampaignInfoSchema.optional(),
  pastPerformance: PastPerformanceSchema.optional(),
  budgetInfo: BudgetInfoSchema.optional(),
  visualIdentityInfo: VisualIdentityInfoSchema.optional(),
});

export type IntakeFormV2Input = z.infer<typeof IntakeFormV2Schema>;

// ── Draft save schema (all optional, partial updates) ────────────

export const IntakeFormDraftSchema = z.object({
  currentStep: z.number().int().min(0).max(7).optional(),
  communicationInfo: CommunicationInfoSchema.partial().optional(),
  productInfo: ProductInfoSchema.partial().optional(),
  audienceInfo: AudienceInfoSchema.partial().optional(),
  brandVoice: BrandVoiceSchema.partial().optional(),
  customerJourney: CustomerJourneySchema.partial().optional(),
  campaignInfo: CampaignInfoSchema.partial().optional(),
  pastPerformance: PastPerformanceSchema.partial().optional(),
  budgetInfo: BudgetInfoSchema.partial().optional(),
  visualIdentityInfo: VisualIdentityInfoSchema.partial().optional(),
});

export type IntakeFormDraftInput = z.infer<typeof IntakeFormDraftSchema>;
