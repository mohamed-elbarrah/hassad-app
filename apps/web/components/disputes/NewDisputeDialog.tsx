"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DisputeCategory, CreateDisputeInput } from "@hassad/shared";
import { DisputeCategory as DisputeCategoryEnum } from "@hassad/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DisputeCategoryIcon } from "./DisputeCategoryIcon";

interface NewDisputeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDisputeInput) => void;
  isLoading?: boolean;
  projectId: string;
  projectName?: string;
}

const CATEGORIES: { value: DisputeCategory; label: string }[] = [
  { value: DisputeCategoryEnum.DELAY, label: "تأخير في المشروع" },
  { value: DisputeCategoryEnum.QUALITY, label: "جودة التسليمات" },
  { value: DisputeCategoryEnum.COMMUNICATION, label: "مشكلة في التواصل" },
  { value: DisputeCategoryEnum.BUDGET, label: "ميزانية" },
  { value: DisputeCategoryEnum.SCOPE, label: "نطاق العمل" },
  { value: DisputeCategoryEnum.ATTITUDE, label: "تعامل" },
  { value: DisputeCategoryEnum.OTHER, label: "أخرى" },
];

export function NewDisputeDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  projectId,
  projectName,
}: NewDisputeDialogProps) {
  const [category, setCategory] = useState<DisputeCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!category) {
      newErrors.category = "الرجاء اختيار نوع النزاع";
    }
    if (title.trim().length < 5) {
      newErrors.title = "العنوان يجب أن يكون 5 أحرف على الأقل";
    }
    if (description.trim().length < 20) {
      newErrors.description = "الوصف يجب أن يكون 20 حرف على الأقل";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !category) return;

    onSubmit({
      projectId,
      category,
      title: title.trim(),
      description: description.trim(),
    });
  };

  const handleClose = () => {
    if (isLoading) return;
    setCategory(null);
    setTitle("");
    setDescription("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold text-natural-100">
            فتح تذكرة نزاع جديدة
          </DialogTitle>
          {projectName && (
            <DialogDescription className="text-portal-note-text">
              المشروع: {projectName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-natural-100">
              نوع النزاع *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setCategory(cat.value);
                    setErrors((e) => ({ ...e, category: "" }));
                  }}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-[1.5px] p-3 text-right transition-all",
                    category === cat.value
                      ? "border-secondary-500 bg-secondary-50/50"
                      : "border-portal-divider hover:border-secondary-300",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <DisputeCategoryIcon category={cat.value} size="sm" />
                  <span className="text-sm text-natural-100">{cat.label}</span>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle className="h-3 w-3" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-natural-100">
              عنوان النزاع *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((e) => ({ ...e, title: "" }));
              }}
              placeholder="أدخل عنوان مختصر للمشكلة..."
              disabled={isLoading}
              className={cn(
                "w-full rounded-xl border-[1.5px] bg-natural-0 px-4 py-3 text-sm text-natural-100 placeholder:text-portal-placeholder focus:border-secondary-500 focus:outline-none",
                errors.title
                  ? "border-danger-300 focus:border-danger-500"
                  : "border-portal-divider"
              )}
            />
            {errors.title && (
              <p className="flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-natural-100">
              تفاصيل النزاع *
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((e) => ({ ...e, description: "" }));
              }}
              placeholder="اشرح المشكلة بالتفصيل..."
              disabled={isLoading}
              rows={4}
              className={cn(
                "w-full resize-none rounded-xl border-[1.5px] bg-natural-0 px-4 py-3 text-sm text-natural-100 placeholder:text-portal-placeholder focus:border-secondary-500 focus:outline-none",
                errors.description
                  ? "border-danger-300 focus:border-danger-500"
                  : "border-portal-divider"
              )}
            />
            {errors.description && (
              <p className="flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
            <p className="text-xs text-portal-note-text">
              يجب أن يكون الوصف 20 حرف على الأقل
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-portal-divider p-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-xl border-portal-divider px-6"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !category || !title || !description}
            className="rounded-xl bg-secondary-500 px-6 hover:bg-secondary-600"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                جاري الإرسال...
              </>
            ) : (
              "إرسال التذكرة"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
