"use client";

import { useCallback, type ReactNode } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  {
    key: "communicationInfo",
    stepIndex: 1,
    title: "الملخص التواصلي",
    icon: User,
    data: undefined,
    isOptional: false,
  },
  {
    key: "productInfo",
    stepIndex: 2,
    title: "معلومات المنتج / الخدمة",
    icon: Building2,
    data: undefined,
    isOptional: true,
  },
  {
    key: "audienceInfo",
    stepIndex: 3,
    title: "الجمهور والرسائل",
    icon: Target,
    data: undefined,
    isOptional: true,
  },
  {
    key: "brandVoice",
    stepIndex: 3,
    title: "الرسائل والهوية",
    icon: FileText,
    data: undefined,
    isOptional: true,
  },
  {
    key: "customerJourney",
    stepIndex: 4,
    title: "رحلة العميل",
    icon: ShoppingCart,
    data: undefined,
    isOptional: true,
  },
  {
    key: "campaignInfo",
    stepIndex: 5,
    title: "الحملة الإعلانية",
    icon: Megaphone,
    data: undefined,
    isOptional: true,
  },
  {
    key: "pastPerformance",
    stepIndex: 6,
    title: "الأداء السابق",
    icon: TrendingUp,
    data: undefined,
    isOptional: true,
  },
  {
    key: "budgetInfo",
    stepIndex: 6,
    title: "الميزانية",
    icon: TrendingUp,
    data: undefined,
    isOptional: true,
  },
  {
    key: "visualIdentityInfo",
    stepIndex: 7,
    title: "الهوية البصرية",
    icon: Palette,
    data: undefined,
    isOptional: true,
  },
];

const FIELD_LABELS: Record<string, string> = {
  contactName: "الاسم",
  businessName: "اسم النشاط",
  industry: "مجال النشاط",
  contactNumber: "رقم التواصل",
  email: "البريد الإلكتروني",
  productStory: "قصة المنتج أو الخدمة",
  detailedDescription: "وصف تفصيلي",
  valueProposition: "القيمة المضافة",
  advantages: "المزايا",
  benefits: "الفوائد",
  contentDirection: "المحتوى",
  customerAnalysis: "تحليل العملاء",
  faq: "الأسئلة الشائعة",
  toneOfVoice: "النبرة",
  boundaries: "الحدود / العوائق",
  verbalSlogan: "الشعار اللفظي",
  appearanceMethod: "طريقة الظهور",
  orderMethods: "طريقة الطلب",
  followUpTools: "أدوات المتابعة",
  campaignGoal: "الهدف",
  campaignDetails: "تفاصيل الحملة",
  campaignOffer: "العرض في الحملة",
  guarantees: "الضمانات",
  campaignSeason: "المناسبة / الموسم",
  competitors: "المنافسون",
  bestCampaigns: "أفضل الحملات السابقة",
  pastPerformance: "أداء الحملات السابقة",
  trackingSetup: "الربط",
  budgetRange: "الميزانية",
  previousReports: "التقارير السابقة",
  hasVisualIdentity: "هوية بصرية جاهزة",
  brandAssets: "ملفات البراند",
  pastDesigns: "تصاميم سابقة",
  productPhotos: "صور المنتج",
  visualDirection: "التوجه البصري",
  logoUrl: "الشعار",
  brandColors: "ألوان العلامة التجارية",
  fonts: "الخطوط",
  guidelinesUrl: "دليل الهوية",
};

function isFileValue(value: unknown): value is string {
  return typeof value === "string" && !!value.match(/\.\w+$/);
}

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function renderFieldValue(key: string, value: unknown): ReactNode {
  if (!hasValue(value)) return null;

  if (key === "brandColors" && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((color, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded border"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    );
  }

  if (key === "faq" && Array.isArray(value) && value[0]?.question) {
    return (
      <div className="space-y-2">
        {value.map((pair: Record<string, unknown>, i) => (
          <div
            key={i}
            className="text-xs bg-primary/5 rounded-lg p-2 space-y-1"
          >
            <p>
              <span className="font-medium text-foreground">س: </span>
              {String(pair.question ?? "")}
            </p>
            <p>
              <span className="font-medium text-foreground">ج: </span>
              {String(pair.answer ?? "")}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (Array.isArray(value)) {
    const allStrings = value.every((v) => typeof v === "string");
    if (!allStrings || value.length === 0) return null;

    const allFiles = value.every((v) => isFileValue(v));

    if (allFiles) {
      return (
        <div className="space-y-1">
          {value.map((name, i) => (
            <p
              key={i}
              className="text-xs flex items-center gap-1.5 text-muted-foreground"
            >
              <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
              {name}
            </p>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-full text-xs bg-primary/5 text-primary"
          >
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return <span className="text-xs">{value ? "نعم" : "لا"}</span>;
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const subKeys = Object.keys(obj).filter((k) => hasValue(obj[k]));
    if (subKeys.length === 0) return null;

    return (
      <div className="space-y-2 pr-2 border-r-2 border-border">
        {subKeys.map((subKey) => {
          const subValue = renderFieldValue(subKey, obj[subKey]);
          if (!subValue) return null;
          return (
            <div key={subKey}>
              <span className="text-xs font-medium text-foreground">
                {FIELD_LABELS[subKey] || subKey}:
              </span>{" "}
              {subValue}
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="text-xs">{String(value)}</span>;
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
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-6 p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">الخطوة 8</p>
          <h3 className="text-xl font-bold text-foreground">
            المراجعة والإرسال
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            راجع بياناتك قبل إرسالها. يمكنك العودة لأي قسم وتعديله.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">اكتمال البيانات:</span>
          <div className="flex-1 h-2 bg-portal-divider rounded-full overflow-hidden max-w-[200px]">
            <div
              className="h-full bg-primary/50 rounded-full transition-all"
              style={{
                width: `${(filledCount / SECTIONS.length) * 100}%`,
              }}
            />
          </div>
          <span className="font-medium text-primary">
            {filledCount} / {SECTIONS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
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
                    ? "border-border"
                    : "border-dashed border-border bg-muted",
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <section.icon className="w-5 h-5 text-muted-foreground" />
                    <h4 className="font-semibold text-sm text-foreground">
                      {section.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasData ? (
                      <CheckCircle2 className="w-4 h-4 text-success-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-warning-600" />
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(section.stepIndex)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {hasData ? (
                  <div className="space-y-2">
                    {keys
                      .filter((key) => hasValue(data![key]))
                      .map((key) => (
                        <div key={key}>
                          <span className="text-xs font-medium text-foreground">
                            {FIELD_LABELS[key] || key}:
                          </span>{" "}
                          {renderFieldValue(key, data![key])}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {section.isOptional
                      ? "لم يتم التعبئة — يمكنك العودة لاحقاً"
                      : "مطلوب لإكمال التسجيل"}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onEdit(7)}
          >
            السابق
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={!formData.communicationInfo || isSubmitting}
            isLoading={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? "جاري الإرسال..." : "إرسال"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
