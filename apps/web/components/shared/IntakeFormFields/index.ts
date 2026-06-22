// Main form components
export { IntakeFormFields, ProfileForm } from "./IntakeFormFields";

// Individual sections (for custom usage)
export { Section1_Business } from "./sections/Section1_Business";
export { Section2_Goals } from "./sections/Section2_Goals";
export { Section3_Journey } from "./sections/Section3_Journey";
export { Section4_Creative } from "./sections/Section4_Creative";
export { Section5_Review } from "./sections/Section5_Review";

// Components
export { FileUploadZone } from "./components/FileUploadZone";

// Hook
export { useIntakeForm } from "./hooks/useIntakeForm";

// Types
export type {
  FormMode,
  Section1Data,
  Section2Data,
  Section3Data,
  Section4Data,
  UploadedFile,
  IntakeFormData,
  SectionProps,
  ProfileFormProps,
} from "./types";