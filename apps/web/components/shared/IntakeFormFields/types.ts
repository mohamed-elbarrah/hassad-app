import type { IntakeFormInput } from "@hassad/shared";

/**
 * Shared types for intake form sections
 * These are used by both the multi-step IntakeForm and the single-page ProfileEditForm
 */

export type FormMode = "portal" | "dashboard";

/**
 * Section 1: Business Basics
 */
export interface Section1Data {
  industry?: string;
  businessDescription?: string;
  targetAudience?: string;
  budgetRangeMin?: number;
  budgetRangeMax?: number;
}

/**
 * Section 2: Marketing Goals
 */
export interface Section2Data {
  campaignGoals?: string[];
  campaignOffer?: string;
  competitors?: string;
  seasonalTiming?: string;
}

/**
 * Section 3: Customer Journey
 */
export interface Section3Data {
  orderMethods?: string[];
  abandonedCartSystem?: boolean;
}

/**
 * Section 4: Creative & Brand Assets
 */
export interface UploadedFile {
  key: string;
  originalName: string;
  mimeType: string;
  size?: number;
  preview?: string;
}

export interface Section4Data {
  hasVisualIdentity?: boolean;
  brandAssets?: {
    logoUrl?: string;
    brandColors?: string[];
    fonts?: string[];
    guidelinesUrl?: string;
  };
  visualReferences?: string;
  uploadedFiles?: UploadedFile[];
}

/**
 * Full intake form data
 */
export type IntakeFormData = Section1Data & Section2Data & Section3Data & Section4Data;

/**
 * Props for section components
 */
export interface SectionProps {
  initialData?: any;
  onDataChange: (data: any) => void;
  onValid: (valid: boolean) => void;
  mode?: FormMode;
}

/**
 * Props for the unified profile form
 */
export interface ProfileFormProps {
  clientId: string;
  profile: IntakeFormData | null;
  onSubmit: (clientId: string, data: IntakeFormData) => Promise<void>;
  onCancel?: () => void;
  onSuccess?: () => void;
  mode?: FormMode;
}