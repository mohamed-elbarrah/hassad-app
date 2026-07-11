/**
 * ProfileSections - Shared Profile Section Components
 *
 * These components support three modes as per the architecture:
 * - wizard: Step-by-step intake form with navigation
 * - edit: Profile editing with all sections visible
 * - view: Read-only profile display
 *
 * Usage:
 *
 * // Wizard mode (IntakeFormV2)
 * <CommunicationSection
 *   mode="wizard"
 *   initialData={data}
 *   onDataChange={handleChange}
 *   onValid={handleValid}
 *   onNext={goToNextStep}
 * />
 *
 * // Edit mode (ProfileEditV2)
 * <CommunicationSection
 *   mode="edit"
 *   initialData={profile.communicationInfo}
 *   onDataChange={handleUpdate}
 * />
 *
 * // View mode (ClientBrief)
 * <CommunicationSection
 *   mode="view"
 *   initialData={profile.communicationInfo}
 * />
 */

// Section components
export { PersonalInfoSection } from "./sections/PersonalInfoSection";
export { CommunicationSection } from "./sections/CommunicationSection";
export { ProductSection } from "./sections/ProductSection";
export { AudienceSection } from "./sections/AudienceSection";
export { JourneySection } from "./sections/JourneySection";
export { CampaignSection } from "./sections/CampaignSection";
export { PerformanceSection } from "./sections/PerformanceSection";
export { VisualSection } from "./sections/VisualSection";

// Layout components
export {
  SectionLayout,
  NavigationButtons,
  ViewField,
  ViewFieldGroup,
  SectionSubtitle,
} from "./SectionLayout";

// Hooks
export { useProfileSection, useFieldArray } from "./useProfileSection";

// Types
export type {
  ProfileMode,
  CommunicationInfo,
  ProductInfo,
  FaqPair,
  AudienceInfo,
  BrandVoice,
  CustomerJourney,
  CampaignInfo,
  PastPerformance,
  BudgetInfo,
  BrandAssets,
  VisualIdentityInfo,
  SectionPropsBase,
  WizardNavigationProps,
  SectionLayoutProps,
  CommunicationSectionProps,
  ProductSectionProps,
  AudienceSectionProps,
  JourneySectionProps,
  CampaignSectionProps,
  PerformanceSectionProps,
  VisualSectionProps,
  ViewFieldProps,
} from "./types";
