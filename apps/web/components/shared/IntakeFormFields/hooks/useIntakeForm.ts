"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface IntakeFormData {
  section1?: any;
  section2?: any;
  section3?: any;
  section4?: any;
}

interface UseIntakeFormOptions {
  onSaveDraft?: (data: IntakeFormData) => Promise<void>;
  autoSaveInterval?: number;
}

export function useIntakeForm({
  onSaveDraft,
  autoSaveInterval = 30000,
}: UseIntakeFormOptions = {}) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<IntakeFormData>({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateSectionData = useCallback(
    (sectionIndex: number, data: any) => {
      setFormData((prev) => ({
        ...prev,
        [`section${sectionIndex + 1}`]: data,
      }));
      setIsDirty(true);
    },
    []
  );

  const triggerAutoSave = useCallback(async () => {
    if (!isDirty || !onSaveDraft) return;

    setIsAutoSaving(true);
    try {
      await onSaveDraft(formData);
      setLastSavedAt(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [isDirty, formData, onSaveDraft]);

  useEffect(() => {
    if (autoSaveInterval > 0 && onSaveDraft) {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setInterval(() => {
        if (isDirty) {
          triggerAutoSave();
        }
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveInterval, onSaveDraft, isDirty, triggerAutoSave]);

  const goToSection = useCallback((index: number) => {
    setCurrentSection(index);
  }, []);

  const nextSection = useCallback(() => {
    setCurrentSection((prev) => Math.min(prev + 1, 4));
  }, []);

  const prevSection = useCallback(() => {
    setCurrentSection((prev) => Math.max(prev - 1, 0));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({});
    setCurrentSection(0);
    setIsDirty(false);
    setLastSavedAt(null);
  }, []);

  const getProgress = useCallback(() => {
    const completedSections = Object.keys(formData).length;
    return Math.round((completedSections / 4) * 100);
  }, [formData]);

  return {
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
    triggerAutoSave,
  };
}