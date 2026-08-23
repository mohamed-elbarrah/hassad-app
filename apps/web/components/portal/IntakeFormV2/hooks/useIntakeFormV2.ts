"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  useGetIntakeFormDraftQuery,
  useSaveIntakeFormDraftMutation,
  useSubmitIntakeFormMutation,
} from "@/features/portal/portalApi";

import { STEPS, TOTAL_STEPS } from "../steps.config";

export function useIntakeFormV2(onSuccess?: () => void) {
  const { data: draft, isLoading: isDraftLoading } =
    useGetIntakeFormDraftQuery();
  const [saveDraft, { isLoading: isSaving }] = useSaveIntakeFormDraftMutation();
  const [submitForm, { isLoading: isSubmitting }] =
    useSubmitIntakeFormMutation();

  const [currentStep, setCurrentStep] = useState(0);
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);
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

    STEPS.forEach((step, wizardStepIdx) => {
      if (step.sectionKeys.length === 0) return;
      const hasData = step.sectionKeys.some((key) => {
        const val = (draft as any)[key];
        return val && typeof val === "object" && Object.keys(val).length > 0;
      });
      if (hasData) completed.push(wizardStepIdx);
      step.sectionKeys.forEach((key) => {
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
    goToStep(Math.min(currentStep + 1, TOTAL_STEPS - 1));
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(Math.max(currentStep - 1, 0));
  }, [currentStep, goToStep]);

  const updateSections = useCallback((data: Record<string, any>) => {
    setSectionData((prev) => ({ ...prev, ...data }));
    setIsDirty(true);
  }, []);

  const markStepCompleted = useCallback((stepIdx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepIdx) ? prev : [...prev, stepIdx],
    );
    setSkippedSteps((prev) => prev.filter((step) => step !== stepIdx));
  }, []);

  const markStepSkipped = useCallback((stepIdx: number) => {
    setSkippedSteps((prev) =>
      prev.includes(stepIdx) ? prev : [...prev, stepIdx],
    );
    setCompletedSteps((prev) => prev.filter((step) => step !== stepIdx));
  }, []);

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
    (wizardStepIdx: number) => {
      const step = STEPS[wizardStepIdx];
      if (!step || step.sectionKeys.length === 0) return undefined;
      if (step.sectionKeys.length === 1) return sectionData[step.sectionKeys[0]];
      return step.sectionKeys.reduce(
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
    skippedSteps,
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
    markStepSkipped,
    triggerSave,
    handleSubmit,
    getStepData,
  };
}
