"use client";

import { CheckCircle2, Edit2 } from "lucide-react";

interface Section5_ReviewProps {
  formData: {
    section1?: any;
    section2?: any;
    section3?: any;
    section4?: any;
  };
  onEdit: (sectionIndex: number) => void;
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

export function Section5_Review({ formData, onEdit }: Section5_ReviewProps) {
  const sections = [
    {
      title: "عن نشاطك التجاري",
      data: formData.section1,
      index: 0,
      fields: [
        { label: "المجال", value: formData.section1?.industry },
        {
          label: "قصة النشاط",
          value: formData.section1?.businessDescription,
          isLong: true,
        },
        {
          label: "الجمهور المستهدف",
          value: formData.section1?.targetAudience,
          isLong: true,
        },
        {
          label: "الميزانية",
          value: formData.section1?.budgetRangeMin
            ? `${formData.section1.budgetRangeMin} - ${formData.section1.budgetRangeMax} SAR`
            : undefined,
        },
      ],
    },
    {
      title: "أهدافك التسويقية",
      data: formData.section2,
      index: 1,
      fields: [
        {
          label: "الأهداف",
          value: formData.section2?.campaignGoals
            ?.map((g: string) => GOAL_LABELS[g])
            .join(", "),
          isLong: true,
        },
        {
          label: "العرض",
          value: formData.section2?.campaignOffer,
          isLong: true,
        },
        { label: "المنافسون", value: formData.section2?.competitors },
        {
          label: "التوقيت الموسمي",
          value: formData.section2?.seasonalTiming,
        },
      ],
    },
    {
      title: "رحلة العميل",
      data: formData.section3,
      index: 2,
      fields: [
        {
          label: "طرق الشراء",
          value: formData.section3?.orderMethods
            ?.map((m: string) => ORDER_METHOD_LABELS[m])
            .join(", "),
          isLong: true,
        },
        {
          label: "نظام السلات المتروكة",
          value: formData.section3?.abandonedCartSystem ? "نعم" : "لا",
        },
      ],
    },
    {
      title: "الهوية والإبداع",
      data: formData.section4,
      index: 3,
      fields: [
        {
          label: "هوية بصرية",
          value: formData.section4?.hasVisualIdentity ? "نعم" : "لا",
        },
        {
          label: "الملفات المرفوعة",
          value: formData.section4?.uploadedFiles?.length
            ? `${formData.section4.uploadedFiles.length} ملفات`
            : "لا يوجد",
        },
        {
          label: "الحسابات المرجعية",
          value: formData.section4?.visualReferences,
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
          className="border border-neutral-200 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 bg-neutral-50 border-b border-neutral-200">
            <h3 className="font-semibold text-natural-100">{section.title}</h3>
            <button
              type="button"
              onClick={() => onEdit(section.index)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors"
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
                    className={`text-sm text-natural-100 ${
                      field.isLong ? "" : "font-medium"
                    }`}
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
