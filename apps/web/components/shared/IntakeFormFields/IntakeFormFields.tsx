"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { useIntakeForm } from "./hooks/useIntakeForm";
import { Section1_Business } from "./sections/Section1_Business";
import { Section2_Goals } from "./sections/Section2_Goals";
import { Section3_Journey } from "./sections/Section3_Journey";
import { Section4_Creative } from "./sections/Section4_Creative";
import type { IntakeFormData, FormMode } from "./types";

const SECTION_TITLES = [
  "عن نشاطك التجاري",
  "أهدافك التسويقية",
  "رحلة العميل",
  "الهوية والإبداع",
];

interface IntakeFormFieldsProps {
  mode?: FormMode;
  showInfoBoxes?: boolean;
  showFileUpload?: boolean;
  onSuccess: () => void;
  onSubmit: (data: IntakeFormData) => Promise<void>;
  submitLabel?: string;
}

export function IntakeFormFields({
  mode = "portal",
  showInfoBoxes = true,
  showFileUpload = true,
  onSuccess,
  onSubmit,
  submitLabel = "إرسال",
}: IntakeFormFieldsProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [sectionValid, setSectionValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    formData,
    updateSectionData,
    nextSection,
    prevSection,
    resetForm,
  } = useIntakeForm({
    autoSaveInterval: 30000,
  });

  const handleSectionValid = useCallback((valid: boolean) => {
    setSectionValid(valid);
  }, []);

  const handleNext = useCallback(() => {
    if (currentSection < 3 && !sectionValid) {
      toast.warning("يرجى مراجعة البيانات في هذا القسم");
      return;
    }
    nextSection();
  }, [currentSection, sectionValid, nextSection]);

  const handleBack = useCallback(() => {
    prevSection();
  }, [prevSection]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      await onSubmit(formData as IntakeFormData);
      toast.success("تم حفظ البيانات بنجاح!");
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, resetForm, onSuccess]);

  const getSectionComponent = useCallback(() => {
    const commonProps = {
      initialData: formData[`section${currentSection + 1}`],
      onDataChange: (data: any) =>
        updateSectionData(currentSection, data),
      onValid: handleSectionValid,
      mode,
      showInfoBox: showInfoBoxes,
    };

    switch (currentSection) {
      case 0:
        return <Section1_Business {...commonProps} />;
      case 1:
        return <Section2_Goals {...commonProps} />;
      case 2:
        return <Section3_Journey {...commonProps} />;
      case 3:
        return <Section4_Creative {...commonProps} showFileUpload={showFileUpload} />;
      default:
        return null;
    }
  }, [currentSection, formData, updateSectionData, handleSectionValid, mode, showInfoBoxes, showFileUpload]);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-natural-100">
          {SECTION_TITLES[currentSection]}
        </h2>
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto pr-2 mb-6">
        {getSectionComponent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-portal-divider">
        {currentSection > 0 && (
          <ActionButton
            type="button"
            variant="outline"
            onClick={handleBack}
            className="min-w-[100px]"
          >
            السابق
          </ActionButton>
        )}

        {currentSection < 3 ? (
          <ActionButton
            type="button"
            variant="primary"
            onClick={handleNext}
            className="min-w-[120px]"
          >
            التالي
          </ActionButton>
        ) : (
          <ActionButton
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            className="min-w-[140px]"
            icon={
              isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )
            }
          >
            {isSubmitting ? "جاري الحفظ..." : submitLabel}
          </ActionButton>
        )}
      </div>
    </div>
  );
}

// Export a single-page version for profile editing
interface ProfileFormProps {
  initialData?: IntakeFormData | null;
  onSubmit: (data: IntakeFormData) => Promise<void>;
  onCancel?: () => void;
  onSuccess?: () => void;
  mode?: FormMode;
  showInfoBoxes?: boolean;
  showFileUpload?: boolean;
}

export function ProfileForm({
  initialData,
  onSubmit,
  onCancel,
  onSuccess,
  mode = "portal",
  showInfoBoxes = false,
  showFileUpload = false,
}: ProfileFormProps) {
  const [sectionValid, setSectionValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create a combined form data object for all sections
  const [formData, setFormData] = useState<IntakeFormData>(() => ({
    industry: initialData?.industry,
    businessDescription: initialData?.businessDescription,
    targetAudience: initialData?.targetAudience,
    budgetRangeMin: initialData?.budgetRangeMin,
    budgetRangeMax: initialData?.budgetRangeMax,
    campaignGoals: initialData?.campaignGoals,
    campaignOffer: initialData?.campaignOffer,
    competitors: initialData?.competitors,
    seasonalTiming: initialData?.seasonalTiming,
    orderMethods: initialData?.orderMethods,
    abandonedCartSystem: initialData?.abandonedCartSystem,
    hasVisualIdentity: initialData?.hasVisualIdentity,
    brandAssets: initialData?.brandAssets,
    visualReferences: initialData?.visualReferences,
    uploadedFiles: initialData?.uploadedFiles,
  }));

  const [section1Data, setSection1Data] = useState<Partial<IntakeFormData>>({
    industry: initialData?.industry,
    businessDescription: initialData?.businessDescription,
    targetAudience: initialData?.targetAudience,
    budgetRangeMin: initialData?.budgetRangeMin,
    budgetRangeMax: initialData?.budgetRangeMax,
  });

  const [section2Data, setSection2Data] = useState<Partial<IntakeFormData>>({
    campaignGoals: initialData?.campaignGoals,
    campaignOffer: initialData?.campaignOffer,
    competitors: initialData?.competitors,
    seasonalTiming: initialData?.seasonalTiming,
  });

  const [section3Data, setSection3Data] = useState<Partial<IntakeFormData>>({
    orderMethods: initialData?.orderMethods,
    abandonedCartSystem: initialData?.abandonedCartSystem,
  });

  const [section4Data, setSection4Data] = useState<Partial<IntakeFormData>>({
    hasVisualIdentity: initialData?.hasVisualIdentity,
    brandAssets: initialData?.brandAssets,
    visualReferences: initialData?.visualReferences,
    uploadedFiles: initialData?.uploadedFiles,
  });

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const combinedData: IntakeFormData = {
        ...section1Data,
        ...section2Data,
        ...section3Data,
        ...section4Data,
      };
      await onSubmit(combinedData);
      toast.success("تم تحديث الملف التعريفي بنجاح");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setIsSubmitting(false);
    }
  }, [section1Data, section2Data, section3Data, section4Data, onSubmit, onSuccess]);

  const isPortal = mode === "portal";
  const borderColor = isPortal ? "border-portal-card-border" : "border-border";

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Section 1: Business */}
      <section>
        <Section1_Business
          initialData={section1Data}
          onDataChange={setSection1Data}
          onValid={setSectionValid}
          mode={mode}
          showInfoBox={showInfoBoxes}
        />
      </section>

      {/* Section 2: Goals */}
      <section>
        <Section2_Goals
          initialData={section2Data}
          onDataChange={setSection2Data}
          onValid={setSectionValid}
          mode={mode}
          showInfoBox={showInfoBoxes}
        />
      </section>

      {/* Section 3: Journey */}
      <section>
        <Section3_Journey
          initialData={section3Data}
          onDataChange={setSection3Data}
          onValid={setSectionValid}
          mode={mode}
          showInfoBox={showInfoBoxes}
        />
      </section>

      {/* Section 4: Creative */}
      <section>
        <Section4_Creative
          initialData={section4Data}
          onDataChange={setSection4Data}
          onValid={setSectionValid}
          mode={mode}
          showInfoBox={showInfoBoxes}
          showFileUpload={showFileUpload}
        />
      </section>

      {/* Actions */}
      <div className={`flex items-center ${onCancel ? "justify-between" : "justify-end"} gap-3 pt-4 border-t ${borderColor}`}>
        {onCancel && (
          <ActionButton
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            إلغاء
          </ActionButton>
        )}

        <ActionButton
          type="button"
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          icon={
            isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )
          }
        >
          {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
        </ActionButton>
      </div>
    </div>
  );
}