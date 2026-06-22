"use client";

import { CheckCircle2, Edit2 } from "lucide-react";
import type { IntakeFormData, FormMode } from "../types";
import { cn } from "@/lib/utils";

// Support both nested format (from useIntakeForm) and flat format
interface Section5_ReviewProps {
  formData: IntakeFormData | { section1?: any; section2?: any; section3?: any; section4?: any };
  onEdit: (sectionIndex: number) => void;
  mode?: FormMode;
}

// Helper to normalize formData to flat format
function normalizeFormData(formData: Section5_ReviewProps['formData']): IntakeFormData {
  if ('section1' in formData) {
    // Nested format from useIntakeForm
    return {
      ...(formData.section1 || {}),
      ...(formData.section2 || {}),
      ...(formData.section3 || {}),
      ...(formData.section4 || {}),
    } as IntakeFormData;
  }
  return formData as IntakeFormData;
}

const GOAL_LABELS: Record<string, string> = {
  increase_sales: "زيادة المبيعات",
  brand_awareness: "تعزيز الوعي بالبراند",
  new_customers: "جذب عملاء جدد",
  launch_product: "إطلاق منتج جديد",
};

const ORDER_METHOD_LABELS: Record<string, string> = {
  online_store: "متجر إلكتروني",
  whatsapp: "واتساب",
  phone: "الهاتف",
  direct: "المتجر المباشر",
  form: "نموذج إلكتروني",
};

const INDUSTRY_LABELS: Record<string, string> = {
  restaurant: "مطعم / كافيه",
  clinic: "عيادة / مركز صحي",
  store: "متجر / تجزئة",
  service: "شركة خدمات",
  education: "تعليم / تدريب",
  health: "صحة / عافية",
  technology: "تكنولوجيا",
  other: "أخرى",
};

const SEASONAL_LABELS: Record<string, string> = {
  ramadan: "رمضان",
  eid: "العيد",
  end_year: "نهاية العام",
  summer: "الصيف",
  valentines: "يوم التأسيس",
  national_day: "اليوم الوطني",
};

export function Section5_Review({
  formData: rawFormData,
  onEdit,
  mode = "portal",
}: Section5_ReviewProps) {
  const isPortal = mode === "portal";
  const borderColor = isPortal ? "border-neutral-200" : "border-border";
  const bgColor = isPortal ? "bg-neutral-50" : "bg-muted/50";

  // Normalize formData to flat format
  const formData = normalizeFormData(rawFormData);

  const sections = [
    {
      title: "عن نشاطك التجاري",
      data: formData,
      index: 0,
      fields: [
        { label: "المجال", value: formData.industry ? INDUSTRY_LABELS[formData.industry] || formData.industry : undefined },
        {
          label: "قصة النشاط",
          value: formData.businessDescription,
          isLong: true,
        },
        {
          label: "الجمهور المستهدف",
          value: formData.targetAudience,
          isLong: true,
        },
        {
          label: "الميزانية",
          value: formData.budgetRangeMin
            ? `${formData.budgetRangeMin} - ${formData.budgetRangeMax} SAR`
            : undefined,
        },
      ],
    },
    {
      title: "أهدافك التسويقية",
      data: formData,
      index: 1,
      fields: [
        {
          label: "الأهداف",
          value: formData.campaignGoals
            ?.map((g: string) => GOAL_LABELS[g])
            .join(", "),
          isLong: true,
        },
        {
          label: "العرض",
          value: formData.campaignOffer,
          isLong: true,
        },
        { label: "المنافسون", value: formData.competitors },
        {
          label: "التوقيت الموسمي",
          value: formData.seasonalTiming ? SEASONAL_LABELS[formData.seasonalTiming] : undefined,
        },
      ],
    },
    {
      title: "رحلة العميل",
      data: formData,
      index: 2,
      fields: [
        {
          label: "طرق الشراء",
          value: formData.orderMethods
            ?.map((m: string) => ORDER_METHOD_LABELS[m])
            .join(", "),
          isLong: true,
        },
        {
          label: "نظام السلات المتروكة",
          value: formData.abandonedCartSystem ? "نعم" : "لا",
        },
      ],
    },
    {
      title: "الهوية والإبداع",
      data: formData,
      index: 3,
      fields: [
        {
          label: "هوية بصرية",
          value: formData.hasVisualIdentity ? "نعم" : "لا",
        },
        {
          label: "الملفات المرفوعة",
          value: formData.uploadedFiles?.length
            ? `${formData.uploadedFiles.length} ملفات`
            : "لا يوجد",
        },
        {
          label: "الحسابات المرجعية",
          value: formData.visualReferences,
          isLong: true,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">
              رائع! قربت على الانتهاء
            </p>
            <p className="text-xs text-green-700 mt-1">
              راجع بياناتك وتأكد من صحتها قبل الإرسال
            </p>
          </div>
        </div>
      </div>

      {sections.map((section) => (
        <div
          key={section.title}
          className={cn("border rounded-2xl overflow-hidden", borderColor)}
        >
          <div className={cn(
            "flex items-center justify-between p-4 border-b",
            bgColor,
            borderColor
          )}>
            <h3 className="font-semibold text-natural-100">{section.title}</h3>
            <button
              type="button"
              onClick={() => onEdit(section.index)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
                isPortal
                  ? "text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
                  : "text-primary hover:bg-primary/10"
              )}
            >
              <Edit2 className="w-3.5 h-3.5" />
              تعديل
            </button>
          </div>

          <div className="p-4 space-y-3">
            {section.fields
              .filter((field) => field.value !== undefined && field.value !== "")
              .map((field, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-sm text-neutral-500 min-w-[140px]">
                    {field.label}:
                  </span>
                  <span
                    className={cn(
                      "text-sm text-natural-100",
                      field.isLong ? "" : "font-medium"
                    )}
                  >
                    {field.value || "-"}
                  </span>
                </div>
              ))}

            {section.fields.filter(
              (field) => field.value !== undefined && field.value !== ""
            ).length === 0 && (
              <p className="text-sm text-neutral-400 italic">
                لم يتم إدخال بيانات
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}