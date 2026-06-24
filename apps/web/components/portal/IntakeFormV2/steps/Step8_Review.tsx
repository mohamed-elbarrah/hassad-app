"use client";

import { useCallback, useState } from "react";
import {
  User,
  Building2,
  FileText,
  Target,
  ShoppingCart,
  Megaphone,
  TrendingUp,
  Palette,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Loader2,
} from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { cn } from "@/lib/utils";

interface ReviewSection {
  key: string;
  stepIndex: number;
  title: string;
  icon: typeof User;
  data: Record<string, unknown> | undefined;
  isOptional: boolean;
}

interface Step8Props {
  formData: {
    communicationInfo?: Record<string, unknown>;
    productInfo?: Record<string, unknown>;
    audienceInfo?: Record<string, unknown>;
    brandVoice?: Record<string, unknown>;
    customerJourney?: Record<string, unknown>;
    campaignInfo?: Record<string, unknown>;
    pastPerformance?: Record<string, unknown>;
    budgetInfo?: Record<string, unknown>;
    visualIdentityInfo?: Record<string, unknown>;
  };
  onEdit: (stepIndex: number) => void;
  onSubmit: () => Promise<void>;
  isSubmitting?: boolean;
}

const SECTIONS: ReviewSection[] = [
  { key: "communicationInfo", stepIndex: 0, title: "الملخص التواصلي", icon: User, data: undefined, isOptional: false },
  { key: "productInfo", stepIndex: 1, title: "معلومات المنتج / الخدمة", icon: Building2, data: undefined, isOptional: true },
  { key: "audienceInfo", stepIndex: 2, title: "الجمهور والرسائل", icon: Target, data: undefined, isOptional: true },
  { key: "brandVoice", stepIndex: 2, title: "الرسائل والهوية", icon: FileText, data: undefined, isOptional: true },
  { key: "customerJourney", stepIndex: 3, title: "رحلة العميل", icon: ShoppingCart, data: undefined, isOptional: true },
  { key: "campaignInfo", stepIndex: 4, title: "الحملة الإعلانية", icon: Megaphone, data: undefined, isOptional: true },
  { key: "pastPerformance", stepIndex: 5, title: "الأداء السابق", icon: TrendingUp, data: undefined, isOptional: true },
  { key: "budgetInfo", stepIndex: 5, title: "الميزانية", icon: TrendingUp, data: undefined, isOptional: true },
  { key: "visualIdentityInfo", stepIndex: 6, title: "الهوية البصرية", icon: Palette, data: undefined, isOptional: true },
];

function valueToString(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (Array.isArray(value)) return value.join("، ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function Step8_Review({
  formData,
  onEdit,
  onSubmit,
  isSubmitting,
}: Step8Props) {
  const handleSubmit = useCallback(async () => {
    await onSubmit();
  }, [onSubmit]);

  const filledCount = SECTIONS.filter((s) => {
    const data = formData[s.key as keyof typeof formData];
    return data && Object.keys(data).length > 0;
  }).length;

  return (
    <SurfaceCard
      className="shadow-none"
      contentClassName="p-6"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-portal-icon mb-1">الخطوة 8</p>
          <h3 className="text-xl font-bold text-natural-100">
            المراجعة والإرسال
          </h3>
          <p className="text-sm text-portal-note-text mt-1">
            راجع بياناتك قبل إرسالها. يمكنك العودة لأي قسم وتعديله.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-portal-icon">اكتمال البيانات:</span>
          <div className="flex-1 h-2 bg-portal-divider rounded-full overflow-hidden max-w-[200px]">
            <div
              className="h-full bg-secondary-500 rounded-full transition-all"
              style={{
                width: `${(filledCount / SECTIONS.length) * 100}%`,
              }}
            />
          </div>
          <span className="font-medium text-secondary-700">
            {filledCount} / {SECTIONS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((section) => {
            const data = formData[section.key as keyof typeof formData];
            const hasData = data && Object.keys(data).length > 0;
            const keys = data ? Object.keys(data) : [];

            return (
              <div
                key={section.key}
                className={cn(
                  "rounded-2xl border p-4",
                  hasData
                    ? "border-portal-card-border"
                    : "border-dashed border-portal-divider bg-portal-bg",
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <section.icon className="w-5 h-5 text-portal-icon" />
                    <h4 className="font-semibold text-sm text-natural-100">
                      {section.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasData ? (
                      <CheckCircle2 className="w-4 h-4 text-success-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-alert-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(section.stepIndex)}
                      className="text-portal-icon hover:text-secondary-500 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {hasData ? (
                  <div className="space-y-1">
                    {keys.map((key) => (
                      <p key={key} className="text-xs text-portal-note-text">
                        <span className="font-medium text-natural-100">
                          {key}:
                        </span>{" "}
                        {valueToString(data![key])}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-portal-note-text">
                    {section.isOptional
                      ? "لم يتم التعبئة — يمكنك العودة لاحقاً"
                      : "مطلوب لإكمال التسجيل"}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-portal-divider">
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => onEdit(6)}
          >
            السابق
          </ActionButton>
          <ActionButton
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!formData.communicationInfo || isSubmitting}
            loading={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? "جاري الإرسال..." : "إرسال"}
          </ActionButton>
        </div>
      </div>
    </SurfaceCard>
  );
}
