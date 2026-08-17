/**
 * ProfileSections - Shared Types
 *
 * These types support the unified profile section components that work in three modes:
 * - wizard: Step-by-step intake form with navigation
 * - edit: Profile editing with all sections visible
 * - view: Read-only profile display
 */

import type { ReactNode } from "react";
import type {
  CommunicationInfo as SharedCommunicationInfo,
  ProductInfo,
  FaqPair,
  AudienceInfo,
  BrandVoice,
  CustomerJourney,
  CampaignInfo,
  PastPerformance,
  BudgetInfo,
  VisualIdentityBrandAssets,
  VisualIdentityInfo,
} from "@hassad/shared";

// ── Mode Types ───────────────────────────────────────────────────────────────────

export type ProfileMode = "wizard" | "edit" | "view";

// ── Section Data Types (re-exported from @hassad/shared) ─────────────────────────

/**
 * Communication section data — marketing/wizard fields only.
 *
 * Personal identity (name, email, phone) lives on `User` and is edited
 * via `PersonalInfoSection`. This section must NOT contain copies of
 * personal identity fields — that was the root cause of the
 * three-table duplication that made `/portal/account` and
 * `/portal/profile` show different names for the same person.
 *
 * Shared's `CommunicationInfo` has 3 extra fields (contactName, contactNumber,
 * email) that the wizard intentionally does not surface here. We narrow via
 * `Pick<>` to preserve the local invariant — single source of truth for the
 * schema, but a section-local type that enforces the no-personal-identity rule.
 */
export type CommunicationInfo = Pick<
  SharedCommunicationInfo,
  "businessName" | "industry"
>;

export type {
  ProductInfo,
  FaqPair,
  AudienceInfo,
  BrandVoice,
  CustomerJourney,
  CampaignInfo,
  PastPerformance,
  BudgetInfo,
  VisualIdentityInfo,
};

/**
 * Local alias for `VisualIdentityBrandAssets` — kept for backwards
 * compatibility with existing `VisualIdentityInfo.brandAssets?: BrandAssets`
 * references throughout the codebase. The shared package uses the longer
 * name to avoid collision with the global concept of brand assets outside
 * the visual-identity section.
 */
export type BrandAssets = VisualIdentityBrandAssets;

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
  onDataChange?: (data: {
    audienceInfo: AudienceInfo;
    brandVoice: BrandVoice;
  }) => void;
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
  onDataChange?: (data: {
    pastPerformance: PastPerformance;
    budgetInfo: BudgetInfo;
  }) => void;
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
