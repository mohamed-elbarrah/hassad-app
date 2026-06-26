/**
 * useProfileSection - Shared Hook for Profile Section Components
 * 
 * Provides common functionality for all profile section components:
 * - Form state management with react-hook-form
 * - Data synchronization with parent component
 * - Validity tracking
 * - Mode-specific behavior (wizard/edit/view)
 */

import { useEffect, useCallback, useState } from "react";
import type { UseFormReturn, FieldValues } from "react-hook-form";
import type { ProfileMode } from "./types";

interface UseProfileSectionOptions<T extends FieldValues> {
  /** React Hook Form instance */
  form: UseFormReturn<T>;
  /** Callback when form data changes */
  onDataChange?: (data: T) => void;
  /** Callback when form validity changes */
  onValid?: (isValid: boolean) => void;
  /** Component mode */
  mode: ProfileMode;
}

/**
 * Hook for managing profile section forms
 * 
 * @example
 * const form = useForm<CommunicationInfo>({
 *   resolver: zodResolver(CommunicationInfoSchema),
 *   defaultValues: initialData,
 *   mode: 'onChange',
 * });
 * 
 * useProfileSection({
 *   form,
 *   onDataChange,
 *   onValid,
 *   mode,
 * });
 */
export function useProfileSection<T extends FieldValues>({
  form,
  onDataChange,
  onValid,
  mode,
}: UseProfileSectionOptions<T>) {
  // Track validity changes
  useEffect(() => {
    if (onValid) {
      onValid(form.formState.isValid);
    }
  }, [form.formState.isValid, onValid]);

  // Sync form changes to parent
  useEffect(() => {
    if (mode === "view") {
      // No sync needed in view mode
      return;
    }

    const subscription = form.watch((values) => {
      if (onDataChange) {
        onDataChange(values as T);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, onDataChange, mode]);

  // Handle form submission (wizard mode)
  const handleSubmit = useCallback(
    (onNext?: () => void) => {
      return form.handleSubmit((data) => {
        if (onDataChange) {
          onDataChange(data);
        }
        onNext?.();
      });
    },
    [form, onDataChange],
  );

  // Check if we should show navigation
  const showNavigation = mode === "wizard";

  // Check if form is editable
  const isEditable = mode !== "view";

  return {
    showNavigation,
    isEditable,
    handleSubmit,
    form,
  };
}

/**
 * Hook for managing multi-field arrays (like FAQ pairs, benefits, etc.)
 */
export function useFieldArray<T>(
  initialItems: T[] = [],
  maxItems?: number,
) {
  const [items, setItems] = useState<T[]>(initialItems);

  const addItem = useCallback((item: T) => {
    if (maxItems && items.length >= maxItems) {
      return false;
    }
    setItems((prev) => [...prev, item]);
    return true;
  }, [items.length, maxItems]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, item: T) => {
    setItems((prev) => prev.map((it, i) => (i === index ? item : it)));
  }, []);

  const resetItems = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    resetItems,
    canAdd: maxItems ? items.length < maxItems : true,
  };
}