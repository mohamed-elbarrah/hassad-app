"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/design-system/ActionButton";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import { ProgressBar } from "./components/ProgressBar";

// Step components
import { Step1_Contact } from "./steps/Step1_Contact";
import { Step2_Product } from "./steps/Step2_Product";
import { Step3_Audience } from "./steps/Step3_Audience";
import { Step4_Journey } from "./steps/Step4_Journey";
import { Step5_Campaign } from "./steps/Step5_Campaign";
import { Step6_Performance } from "./steps/Step6_Performance";
import { Step7_Budget } from "./steps/Step7_Budget";
import { Step8_Design } from "./steps/Step8_Design";

// Step configuration
const STEPS = [
  { number: 1, title: "الاتصال الأساسي", description: "معلومات التواصل الأساسية" },
  { number: 2, title: "معلومات المنتج", description: "قصة المنتج وتفاصيله" },
  { number: 3, title: "الجمهور والرسائل", description: "تحليل الجمهور والهوية" },
  { number: 4, title: "تجربة العميل", description: "طريقة الطلب والمتابعة" },
  { number: 5, title: "الحملة التسويقية", description: "الهدف والعروض" },
  { number: 6, title: "الأداء السابق", description: "تحليل الحملات السابقة" },
  { number: 7, title: "الميزانية والتخطيط", description: "الميزانية والدفع" },
  { number: 8, title: "التصميم", description: "الهوية البصرية" },
];

interface IntakeFormProps {
  onSuccess: () => void;
}

export function IntakeForm({ onSuccess }: IntakeFormProps) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    step1: {} as any,
    step2: {} as any,
    step3: {} as any,
    step4: {} as any,
    step5: {} as any,
    step6: {} as any,
    step7: {} as any,
    step8: {} as any,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate progress
  const progress = Math.round((currentStep / 8) * 100);

  // Validation - check if current step is valid
  const isStepValid = useCallback(() => {
    return true;
  }, [currentStep, formData]);

  const handleNext = useCallback(async () => {
    if (!isStepValid()) {
      toast.warning("يرجى مراجعة البيانات في هذه الخطوة");
      return;
    }

    if (currentStep < 8) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, isStepValid]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleUpdateStepData = useCallback(
    (step: number, data: any) => {
      setFormData((prev) => ({
        ...prev,
        [`step${step}`]: data,
      }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      // Submit intake form data
      const response = await fetch(`/api/v1/portal/intake-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData: formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "فشل في إرسال البيانات");
      }

      toast.success("تم حفظ البيانات بنجاح!");

      // Update user state to mark intake as completed
      await fetch(`/api/v1/clients/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intakeCompleted: true,
        }),
      });

      // Reset form
      setCurrentStep(1);
      setFormData({
        step1: {},
        step2: {},
        step3: {},
        step4: {},
        step5: {},
        step6: {},
        step7: {},
        step8: {},
      });

      // Success callback
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSuccess]);

  // Get current step component
  const getStepComponent = useCallback(() => {
    const stepProps = {
      onBack: handleBack,
      onNext: handleNext,
      updateStepData: handleUpdateStepData,
    };

    switch (currentStep) {
      case 1:
        return <Step1_Contact {...stepProps} />;
      case 2:
        return <Step2_Product {...stepProps} />;
      case 3:
        return <Step3_Audience {...stepProps} />;
      case 4:
        return <Step4_Journey {...stepProps} />;
      case 5:
        return <Step5_Campaign {...stepProps} />;
      case 6:
        return <Step6_Performance {...stepProps} />;
      case 7:
        return <Step7_Budget {...stepProps} />;
      case 8:
        return <Step8_Design {...stepProps} />;
      default:
        return null;
    }
  }, [currentStep, handleBack, handleNext, handleUpdateStepData]);

  // Determine button labels
  const showBackButton = currentStep > 1;
  const isLastStep = currentStep === 8;
  const showSubmitButton = isLastStep;
  const showNextButton = !isLastStep;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-natural-100">
            {STEPS[currentStep - 1]?.title}
          </h2>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} totalSteps={8} progress={progress} />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto pr-2 mb-6">
        {getStepComponent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-100">
        {showBackButton && (
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

        {showNextButton && (
          <ActionButton
            type="button"
            variant="primary"
            onClick={handleNext}
            className="min-w-[120px]"
          >
            التالي
          </ActionButton>
        )}

        {showSubmitButton && (
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
              "حفظ والمتابعة"
            )}
          </ActionButton>
        )}
      </div>
    </div>
  );
}

export default IntakeForm;
