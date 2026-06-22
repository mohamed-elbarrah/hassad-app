"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/design-system/ActionButton";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { ProgressBar } from "./components/ProgressBar";
import { useIntakeForm } from "./hooks/useIntakeForm";
import { Section1_Business } from "./sections/Section1_Business";
import { Section2_Goals } from "./sections/Section2_Goals";
import { Section3_Journey } from "./sections/Section3_Journey";
import { Section4_Creative } from "./sections/Section4_Creative";
import { Section5_Review } from "./sections/Section5_Review";

const SECTION_TITLES = [
  "عن نشاطك التجاري",
  "أهدافك التسويقية",
  "رحلة العميل",
  "الهوية والإبداع",
  "المراجعة والإرسال",
];

interface IntakeFormProps {
  onSuccess: () => void;
}

export function IntakeForm({ onSuccess }: IntakeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectionValid, setSectionValid] = useState(true);

  const {
    currentSection,
    formData,
    isDirty,
    lastSavedAt,
    isAutoSaving,
    updateSectionData,
    goToSection,
    nextSection,
    prevSection,
    resetForm,
    getProgress,
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
      const submitData = {
        ...formData.section1,
        ...formData.section2,
        ...formData.section3,
        ...formData.section4,
      };

      const response = await fetch(`/api/v1/portal/intake-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "فشل في إرسال البيانات");
      }

      toast.success("تم حفظ البيانات بنجاح! جارٍ تحويلك...");

      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, resetForm, onSuccess]);

  const getSectionComponent = useCallback(() => {
    const commonProps = {
      initialData: formData[`section${currentSection + 1}`],
      onDataChange: (data: any) =>
        updateSectionData(currentSection, data),
      onValid: handleSectionValid,
    };

    switch (currentSection) {
      case 0:
        return <Section1_Business {...commonProps} />;
      case 1:
        return <Section2_Goals {...commonProps} />;
      case 2:
        return <Section3_Journey {...commonProps} />;
      case 3:
        return <Section4_Creative {...commonProps} />;
      case 4:
        return (
          <Section5_Review
            formData={formData}
            onEdit={goToSection}
          />
        );
      default:
        return null;
    }
  }, [currentSection, formData, updateSectionData, handleSectionValid, goToSection]);

  const isLastSection = currentSection === 4;
  const isFirstSection = currentSection === 0;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-natural-100">
            {SECTION_TITLES[currentSection]}
          </h2>
          {isDirty && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              {isAutoSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : lastSavedAt ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>تم الحفظ {lastSavedAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                </>
              ) : null}
            </div>
          )}
        </div>

        <ProgressBar
          currentSection={currentSection}
          totalSections={5}
          progress={getProgress()}
          sectionTitles={SECTION_TITLES}
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 mb-6">
        {getSectionComponent()}
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-100">
        {!isFirstSection && (
          <ActionButton
            type="button"
            variant="outline"
            onClick={handleBack}
            icon={<ChevronLeft className="w-4 h-4" />}
            iconPosition="right"
            className="min-w-[100px]"
          >
            السابق
          </ActionButton>
        )}

        {isLastSection ? (
          <ActionButton
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              "إرسال والبدء"
            )}
          </ActionButton>
        ) : (
          <ActionButton
            type="button"
            variant="primary"
            onClick={handleNext}
            className="min-w-[120px]"
          >
            التالي
          </ActionButton>
        )}
      </div>
    </div>
  );
}

export default IntakeForm;
