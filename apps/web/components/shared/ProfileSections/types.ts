/**
 * ProfileSections - Shared Types
 * 
 * These types support the unified profile section components that work in three modes:
 * - wizard: Step-by-step intake form with navigation
 * - edit: Profile editing with all sections visible
 * - view: Read-only profile display
 */

import type { ReactNode } from "react";

// ── Mode Types ───────────────────────────────────────────────────────────────────

export type ProfileMode = "wizard" | "edit" | "view";

// ── Section Data Types (mirrors IntakeFormV2Input from @hassad/shared) ───────────

/**
 * Communication section data — marketing/wizard fields only.
 *
 * Personal identity (name, email, phone) lives on `User` and is edited
 * via `PersonalInfoSection`. This section must NOT contain copies of
 * personal identity fields — that was the root cause of the
 * three-table duplication that made `/portal/account` and
 * `/portal/profile` show different names for the same person.
 */
export interface CommunicationInfo {
  businessName?: string;
  industry?: string;
}

export interface ProductInfo {
  productStory?: string;
  detailedDescription?: string;
  valueProposition?: string;
  advantages?: string;
  benefits?: string[];
  contentDirection?: string;
}

export interface FaqPair {
  question?: string;
  answer?: string;
}

export interface AudienceInfo {
  customerAnalysis?: string;
  faq?: FaqPair[];
}

export interface BrandVoice {
  toneOfVoice?: string;
  boundaries?: string;
  verbalSlogan?: string;
  appearanceMethod?: string;
}

export interface CustomerJourney {
  orderMethods?: string[];
  followUpTools?: string;
}

export interface CampaignInfo {
  campaignGoal?: string;
  campaignDetails?: string;
  campaignOffer?: string;
  guarantees?: string;
  campaignSeason?: string;
  competitors?: string;
}

export interface PastPerformance {
  bestCampaigns?: string;
  pastPerformance?: string;
  trackingSetup?: string;
}

export interface BudgetInfo {
  budgetRange?: number;
  previousReports?: string[];
}

export interface BrandAssets {
  logoUrl?: string;
  brandColors?: string[];
  fonts?: string[];
  guidelinesUrl?: string;
}

export interface VisualIdentityInfo {
  hasVisualIdentity?: boolean;
  brandAssets?: BrandAssets;
  pastDesigns?: string;
  productPhotos?: string[];
  visualDirection?: string[];
}

// ── Section Props Base ───────────────────────────────────────────────────────────

export interface SectionPropsBase {
  /** Component mode: wizard (step-by-step), edit (all sections), view (read-only) */
  mode: ProfileMode;
  /** Initial data for the section */
  initialData?: unknown;
  /** Callback when data changes */
  onDataChange?: (data: unknown) => void;
  /** Callback when form validity changes */
  onValid?: (isValid: boolean) => void;
}

// ── Wizard Mode Props ────────────────────────────────────────────────────────────

export interface WizardNavigationProps {
  /** Navigate to next step (wizard mode only) */
  onNext?: () => void;
  /** Navigate to previous step (wizard mode only) */
  onBack?: () => void;
  /** Skip this step (wizard mode only) */
  onSkip?: () => void;
  /** Hide navigation buttons (for edit mode) */
  hideNavigation?: boolean;
}

// ── Section Layout Props ─────────────────────────────────────────────────────────

export interface SectionLayoutProps {
  /** Step number (shown in wizard mode) */
  stepNumber?: number;
  /** Section title */
  title: string;
  /** Help text / instructions */
  instructions?: string[];
  /** Whether this step is optional */
  isOptional?: boolean;
  /** Skip callback (wizard mode) */
  onSkip?: () => void;
  /** Children content */
  children: ReactNode;
}

// ── Communication Section Props ───────────────────────────────────────────────────

export interface CommunicationSectionProps {
  mode: ProfileMode;
  initialData?: CommunicationInfo;
  onDataChange?: (data: CommunicationInfo) => void;
  onValid?: (isValid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  hideNavigation?: boolean;
}

// ── Product Section Props ────────────────────────────────────────────────────────

export interface ProductSectionProps {
  mode: ProfileMode;
  initialData?: ProductInfo;
  onDataChange?: (data: ProductInfo) => void;
  onValid?: (isValid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

// ── Audience Section Props ───────────────────────────────────────────────────────

export interface AudienceSectionProps {
  mode: ProfileMode;
  initialData?: {
    audienceInfo?: AudienceInfo;
    brandVoice?: BrandVoice;
  };
  onDataChange?: (data: { audienceInfo: AudienceInfo; brandVoice: BrandVoice }) => void;
  onValid?: (isValid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

// ── Customer Journey Section Props ───────────────────────────────────────────────

export interface JourneySectionProps {
  mode: ProfileMode;
  initialData?: CustomerJourney;
  onDataChange?: (data: CustomerJourney) => void;
  onValid?: (isValid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

// ── Campaign Section Props ───────────────────────────────────────────────────────

export interface CampaignSectionProps {
  mode: ProfileMode;
  initialData?: CampaignInfo;
  onDataChange?: (data: CampaignInfo) => void;
  onValid?: (isValid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

// ── Performance Section Props ────────────────────────────────────────────────────

export interface PerformanceSectionProps {
  mode: ProfileMode;
  initialData?: {
    pastPerformance?: PastPerformance;
    budgetInfo?: BudgetInfo;
  };
  onDataChange?: (data: { pastPerformance: PastPerformance; budgetInfo: BudgetInfo }) => void;
  onValid?: (isValid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

// ── Visual Identity Section Props ────────────────────────────────────────────────

export interface VisualSectionProps {
  mode: ProfileMode;
  initialData?: VisualIdentityInfo;
  onDataChange?: (data: VisualIdentityInfo) => void;
  onValid?: (isValid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

// ── View Mode Display Types ──────────────────────────────────────────────────────

export interface ViewFieldProps {
  label: string;
  value?: string | string[] | null;
  icon?: React.ComponentType<{ className?: string }>;
  dir?: "rtl" | "ltr";
  asList?: boolean;
}