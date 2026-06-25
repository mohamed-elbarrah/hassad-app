"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  useGetIntakeFormDraftQuery,
  useSaveIntakeFormDraftMutation,
  useSubmitIntakeFormMutation,
} from "@/features/portal/portalApi";

export const STEP_SECTION_MAP: [string, ...string[]][] = [
  ["communicationInfo"],
  ["productInfo"],
  ["audienceInfo", "brandVoice"],
  ["customerJourney"],
  ["campaignInfo"],
  ["pastPerformance", "budgetInfo"],
  ["visualIdentityInfo"],
];

const TOTAL_STEPS = STEP_SECTION_MAP.length;

export function useIntakeFormV2(onSuccess?: () => void) {
  const { data: draft, isLoading: isDraftLoading } = useGetIntakeFormDraftQuery();
  const [saveDraft, { isLoading: isSaving }] = useSaveIntakeFormDraftMutation();
  const [submitForm, { isLoading: isSubmitting }] = useSubmitIntakeFormMutation();

  const [currentStep, setCurrentStep] = useState(0);
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const sectionDataRef = useRef(sectionData);
  sectionDataRef.current = sectionData;

  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  const draftLoaded = useRef(false);

  useEffect(() => {
    if (!draft || draftLoaded.current) return;
    draftLoaded.current = true;

    const data: Record<string, any> = {};
    const completed: number[] = [];

    STEP_SECTION_MAP.forEach((keys, stepIdx) => {
      const hasData = keys.some((key) => {
        const val = (draft as any)[key];
        return val && typeof val === "object" && Object.keys(val).length > 0;
      });
      if (hasData) completed.push(stepIdx);
      keys.forEach((key) => {
        const val = (draft as any)[key];
        if (val && typeof val === "object" && Object.keys(val).length > 0) {
          data[key] = val;
        }
      });
    });

    setSectionData(data);
    setCompletedSteps(completed);
    if (typeof draft.currentStep === "number" && draft.currentStep > 0) {
      setCurrentStep(Math.min(draft.currentStep, TOTAL_STEPS - 1));
    }
  }, [draft]);

  const triggerSave = useCallback(async () => {
    if (!isDirtyRef.current) return;
    setIsAutoSaving(true);
    try {
      await saveDraft({
        ...sectionDataRef.current,
        currentStep: currentStepRef.current,
      } as any).unwrap();
      setLastSavedAt(new Date());
      setIsDirty(false);
    } catch {
      toast.error("فشل الحفظ التلقائي");
    } finally {
      setIsAutoSaving(false);
    }
  }, [saveDraft]);

  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (isDirtyRef.current) triggerSave();
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [triggerSave]);

  const goToStep = useCallback(
    (step: number) => {
      if (isDirtyRef.current) triggerSave();
      setCurrentStep(step);
    },
    [triggerSave],
  );

  const nextStep = useCallback(() => {
    goToStep(Math.min(currentStep + 1, TOTAL_STEPS));
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(Math.max(currentStep - 1, 0));
  }, [currentStep, goToStep]);

  const updateSections = useCallback((data: Record<string, any>) => {
    setSectionData((prev) => ({ ...prev, ...data }));
    setIsDirty(true);
  }, []);

  const markStepCompleted = useCallback(
    (stepIdx: number) => {
      setCompletedSteps((prev) =>
        prev.includes(stepIdx) ? prev : [...prev, stepIdx],
      );
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    try {
      await submitForm({
        ...sectionDataRef.current,
        currentStep: currentStepRef.current,
      } as any).unwrap();
      toast.success("تم إرسال البيانات بنجاح");
      onSuccess?.();
    } catch {
      toast.error("فشل إرسال البيانات");
    }
  }, [submitForm, onSuccess]);

  const getStepData = useCallback(
    (stepIdx: number) => {
      const keys = STEP_SECTION_MAP[stepIdx];
      if (keys.length === 1) return sectionData[keys[0]];
      return keys.reduce(
        (acc, key) => ({ ...acc, [key]: sectionData[key] }),
        {},
      );
    },
    [sectionData],
  );

  return {
    currentStep,
    sectionData,
    completedSteps,
    isDraftLoading,
    isSaving,
    isAutoSaving,
    isSubmitting,
    isDirty,
    lastSavedAt,
    goToStep,
    nextStep,
    prevStep,
    updateSections,
    markStepCompleted,
    triggerSave,
    handleSubmit,
    getStepData,
  };
}
