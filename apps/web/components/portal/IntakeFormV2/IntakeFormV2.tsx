"use client";

import { useCallback } from "react";
import {
  CommunicationSection,
  ProductSection,
  AudienceSection,
  JourneySection,
  CampaignSection,
  PerformanceSection,
  VisualSection,
} from "@/components/shared/ProfileSections";
import { StepProgressBar } from "./components/StepProgressBar";
import { AutoSaveIndicator } from "./components/AutoSaveIndicator";
import { useIntakeFormV2, STEP_SECTION_MAP } from "./hooks/useIntakeFormV2";
import { Step8_Review } from "./steps/Step8_Review";

interface IntakeFormV2Props {
  onSuccess: () => void;
}

export function IntakeFormV2({ onSuccess }: IntakeFormV2Props) {
  const {
    currentStep,
    sectionData,
    completedSteps,
    isDraftLoading,
    isAutoSaving,
    isSubmitting,
    isDirty,
    lastSavedAt,
    goToStep,
    nextStep,
    prevStep,
    updateSections,
    markStepCompleted,
    getStepData,
    handleSubmit,
  } = useIntakeFormV2(onSuccess);

  const handleStepDataChange = useCallback(
    (stepIdx: number, data: any) => {
      const keys = STEP_SECTION_MAP[stepIdx];
      if (keys.length === 1) {
        updateSections({ [keys[0]]: data });
      } else {
        updateSections(data);
      }
      markStepCompleted(stepIdx);
    },
    [updateSections, markStepCompleted],
  );

  const handleStepNext = useCallback(
    (stepIdx: number) => {
      markStepCompleted(stepIdx);
      nextStep();
    },
    [markStepCompleted, nextStep],
  );

  if (isDraftLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <CommunicationSection
            mode="wizard"
            initialData={getStepData(0)}
            onDataChange={(data) => handleStepDataChange(0, data)}
            onValid={() => {}}
            onNext={() => handleStepNext(0)}
          />
        );
      case 1:
        return (
          <ProductSection
            mode="wizard"
            initialData={getStepData(1)}
            onDataChange={(data) => handleStepDataChange(1, data)}
            onValid={() => {}}
            onNext={() => handleStepNext(1)}
            onBack={prevStep}
            onSkip={() => goToStep(2)}
          />
        );
      case 2:
        return (
          <AudienceSection
            mode="wizard"
            initialData={{
              customerAnalysis: sectionData.audienceInfo?.customerAnalysis,
              faq: sectionData.audienceInfo?.faq,
              toneOfVoice: sectionData.brandVoice?.toneOfVoice,
              boundaries: sectionData.brandVoice?.boundaries,
              verbalSlogan: sectionData.brandVoice?.verbalSlogan,
              appearanceMethod: sectionData.brandVoice?.appearanceMethod,
            }}
            onDataChange={(data) => handleStepDataChange(2, data)}
            onValid={() => {}}
            onNext={() => handleStepNext(2)}
            onBack={prevStep}
            onSkip={() => goToStep(3)}
          />
        );
      case 3:
        return (
          <JourneySection
            mode="wizard"
            initialData={getStepData(3)}
            onDataChange={(data) => handleStepDataChange(3, data)}
            onValid={() => {}}
            onNext={() => handleStepNext(3)}
            onBack={prevStep}
            onSkip={() => goToStep(4)}
          />
        );
      case 4:
        return (
          <CampaignSection
            mode="wizard"
            initialData={getStepData(4)}
            onDataChange={(data) => handleStepDataChange(4, data)}
            onValid={() => {}}
            onNext={() => handleStepNext(4)}
            onBack={prevStep}
            onSkip={() => goToStep(5)}
          />
        );
      case 5:
        return (
          <PerformanceSection
            mode="wizard"
            initialData={getStepData(5)}
            onDataChange={(data) => handleStepDataChange(5, data)}
            onValid={() => {}}
            onNext={() => handleStepNext(5)}
            onBack={prevStep}
            onSkip={() => goToStep(6)}
          />
        );
      case 6:
        return (
          <VisualSection
            mode="wizard"
            initialData={getStepData(6)}
            onDataChange={(data) => handleStepDataChange(6, data)}
            onValid={() => {}}
            onNext={() => handleStepNext(6)}
            onBack={prevStep}
            onSkip={() => goToStep(7)}
          />
        );
      case 7:
        return (
          <Step8_Review
            formData={sectionData as any}
            onEdit={goToStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <AutoSaveIndicator
            isAutoSaving={isAutoSaving}
            isDirty={isDirty}
            lastSavedAt={lastSavedAt}
          />
        </div>

        <StepProgressBar
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      </div>

      <div className="flex-1 overflow-y-auto">{renderStep()}</div>
    </div>
  );
}

export default IntakeFormV2;