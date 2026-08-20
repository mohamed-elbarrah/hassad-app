"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, Upload, Save, X, Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FormInput } from "@/components/ui/formInput";
import { Select, SelectItem } from "@/components/design-system/Select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ActionButton } from "@/components/design-system/ActionActionButton";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";
import { toast } from "sonner";
import {
  useCreateCurrencySettingMutation,
  useUpdateCurrencySettingMutation,
  useUploadSvgMutation,
  type CurrencySetting,
} from "@/features/settings/settingsApi";
import type { CurrencyConfig } from "@/hooks/useCurrency";

interface CurrencyFormData {
  code: string;
  name: string;
  symbol: string;
  symbolType: "TEXT" | "SVG_URL" | "SVG_INLINE";
  svgKey: string;
  svgWidth: number;
  svgHeight: number;
  exchangeRate: number;
  isActive: boolean;
  isDefault: boolean;
}

interface CurrencyFormProps {
  initialData?: CurrencySetting;
  mode: "create" | "edit";
}

const SYMBOL_TYPE_OPTIONS = [
  { value: "TEXT", label: "نص" },
  { value: "SVG_URL", label: "رابط SVG" },
  { value: "SVG_INLINE", label: "رفع SVG" },
];

const LOCALE = "ar-SA-u-nu-latn";

function formatPreview(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildPreviewCurrency(data: CurrencyFormData): CurrencyConfig {
  return {
    code: data.code || "---",
    name: data.name || "---",
    symbol: data.symbol || "---",
    symbolType: data.symbolType,
    svgKey: data.svgKey || null,
    svgWidth: data.svgWidth || null,
    svgHeight: data.svgHeight || null,
    isDefault: data.isDefault,
    exchangeRate: data.exchangeRate || 1,
  };
}

function LivePreview({ data }: { data: CurrencyFormData }) {
  const preview = buildPreviewCurrency(data);
  const hasSymbol = data.symbol || data.svgKey;

  return (
    <Card title="معاينة مباشرة" icon={Eye}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-portal-note-text mb-1">الرمز</p>
            <p className="text-xl font-bold text-natural-100">{preview.code}</p>
          </div>
          <div>
            <p className="text-xs text-portal-note-text mb-1">الاسم</p>
            <p className="text-xl text-natural-100">{preview.name}</p>
          </div>
          <div>
            <p className="text-xs text-portal-note-text mb-1">الترميز</p>
            <div className="flex items-center gap-2">
              <SymbolRenderer currency={preview} width={32} height={32} />
              <span className="text-xl text-secondary-500">
                {preview.symbol}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-portal-divider pt-4">
          <p className="text-sm font-medium text-portal-note-text mb-3">
            معاينة المبلغ
          </p>
          {hasSymbol ? (
            <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-2xl font-semibold text-natural-100">
                <span>{formatPreview(1500)}</span>
                <SymbolRenderer currency={preview} width={28} height={28} />
              </div>
              <div className="flex items-center gap-2 text-lg font-medium text-natural-100">
                <span>{formatPreview(25000.5)}</span>
                <SymbolRenderer currency={preview} width={22} height={22} />
              </div>
              <div className="flex items-center gap-2 text-sm text-portal-note-text">
                <span>{formatPreview(99.99)}</span>
                <SymbolRenderer currency={preview} width={16} height={16} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-portal-note-text">
              يرجى إدخال الترميز لعرض المعاينة
            </p>
          )}
        </div>

        {data.isDefault && (
          <div className="bg-secondary-50 border border-secondary-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-sm text-secondary-700 font-medium">
              هذه العملة هي العملة الافتراضية للنظام
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function CurrencyForm({ initialData, mode }: CurrencyFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createCurrency, { isLoading: isCreating }] =
    useCreateCurrencySettingMutation();
  const [updateCurrency, { isLoading: isUpdating }] =
    useUpdateCurrencySettingMutation();
  const [uploadSvg, { isLoading: isUploading }] = useUploadSvgMutation();

  const [formData, setFormData] = useState<CurrencyFormData>({
    code: initialData?.code ?? "",
    name: initialData?.name ?? "",
    symbol: initialData?.symbol ?? "",
    symbolType: initialData?.symbolType ?? "TEXT",
    svgKey: initialData?.svgKey ?? "",
    svgWidth: initialData?.svgWidth ?? 24,
    svgHeight: initialData?.svgHeight ?? 20,
    exchangeRate: initialData?.exchangeRate ?? 1,
    isActive: initialData?.isActive ?? true,
    isDefault: initialData?.isDefault ?? false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CurrencyFormData, string>>
  >({});

  function updateField<K extends keyof CurrencyFormData>(
    key: K,
    value: CurrencyFormData[K],
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!formData.code.trim() || formData.code.trim().length < 2) {
      newErrors.code = "رمز العملة مطلوب (حرفين على الأقل)";
    }
    if (!formData.name.trim()) {
      newErrors.name = "اسم العملة مطلوب";
    }
    if (!formData.symbol.trim()) {
      newErrors.symbol = "الترميز مطلوب";
    }
    if (!formData.exchangeRate || formData.exchangeRate <= 0) {
      newErrors.exchangeRate = "سعر الصرف يجب أن يكون أكبر من 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const body: Record<string, unknown> = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      symbol: formData.symbol.trim(),
      symbolType: formData.symbolType,
      exchangeRate: formData.exchangeRate,
      isActive: formData.isActive,
      isDefault: formData.isDefault,
    };

    if (formData.svgKey) {
      body.svgKey = formData.svgKey;
    }
    if (formData.svgWidth) {
      body.svgWidth = formData.svgWidth;
    }
    if (formData.svgHeight) {
      body.svgHeight = formData.svgHeight;
    }

    try {
      if (mode === "create") {
        await createCurrency(body).unwrap();
        toast.success("تمت إضافة العملة بنجاح");
      } else {
        await updateCurrency({
          id: initialData!.id,
          body,
        }).unwrap();
        toast.success("تم تحديث العملة بنجاح");
      }
      router.push("/dashboard/admin/settings/currencies");
    } catch {
      toast.error(
        mode === "create"
          ? "حدث خطأ أثناء إضافة العملة"
          : "حدث خطأ أثناء تحديث العملة",
      );
    }
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadSvg({ file }).unwrap();
      updateField("svgKey", result.key);
      if (result.key.endsWith(".svg")) {
        updateField("svgWidth", 24);
        updateField("svgHeight", 20);
      }
      toast.success("تم رفع ملف SVG بنجاح");
    } catch {
      toast.error("فشل رفع ملف SVG");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleCancel() {
    router.push("/dashboard/admin/settings/currencies");
  }

  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="page-shell" dir="rtl">
      {/* Main form */}
      <Card
        title={mode === "create" ? "إضافة عملة جديدة" : "تعديل العملة"}
        icon={mode === "create" ? undefined : undefined}
      >
        <div className="space-y-6">
          {/* Basic info */}
          <div>
            <h3 className="text-base font-semibold text-natural-100 mb-4">
              المعلومات الأساسية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="رمز العملة"
                placeholder="مثال: USD"
                value={formData.code}
                onChange={(e) => updateField("code", e.target.value)}
                error={errors.code}
              />
              <FormInput
                label="اسم العملة"
                placeholder="مثال: دولار أمريكي"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                error={errors.name}
              />
              <FormInput
                label="الترميز"
                placeholder="مثال: $"
                value={formData.symbol}
                onChange={(e) => updateField("symbol", e.target.value)}
                error={errors.symbol}
              />
            </div>
          </div>

          {/* Symbol type */}
          <div>
            <h3 className="text-base font-semibold text-natural-100 mb-4">
              نوع الترميز
            </h3>
            <Select
              label="نوع الترميز"
              value={formData.symbolType}
              onValueChange={(val) =>
                updateField("symbolType", val as CurrencyFormData["symbolType"])
              }
            >
              {SYMBOL_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>

            {formData.symbolType === "SVG_URL" && (
              <div className="mt-4">
                <FormInput
                  label="رابط ملف SVG"
                  placeholder="https://example.com/icon.svg"
                  value={formData.svgKey}
                  onChange={(e) => updateField("svgKey", e.target.value)}
                />
              </div>
            )}

            {formData.symbolType === "SVG_INLINE" && (
              <div className="mt-4">
                <p className="block text-sm font-medium text-secondary-500 mb-2">
                  رفع ملف SVG
                </p>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".svg"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <ActionButton
                    onClick={() => fileInputRef.current?.click()}
                    icon={<Upload className="size-4" />}
                    loading={isUploading}
                    disabled={isUploading}
                  >
                    اختيار ملف
                  </ActionButton>
                  {formData.svgKey && (
                    <div className="flex items-center gap-2 text-sm text-success-600">
                      <span>✓ تم رفع الملف</span>
                      <button
                        type="button"
                        onClick={() => updateField("svgKey", "")}
                        className="text-danger-500 hover:text-danger-700"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {formData.symbolType === "TEXT" && formData.svgKey && (
              <p className="mt-2 text-xs text-portal-note-text">
                تم تعيين نوع الترميز إلى "نص"، سيتم تجاهل ملف SVG المرفوع.
              </p>
            )}
          </div>

          {/* Currency settings */}
          <div>
            <h3 className="text-base font-semibold text-natural-100 mb-4">
              إعدادات العملة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormInput
                  label="سعر الصرف"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="1"
                  value={String(formData.exchangeRate)}
                  onChange={(e) =>
                    updateField("exchangeRate", Number(e.target.value))
                  }
                  error={errors.exchangeRate}
                />
                <p className="text-xs text-portal-note-text mt-1">
                  سعر العملة مقارنة بالعملة الافتراضية (1{" "}
                  {formData.code || "..."} = {formData.exchangeRate || "..."})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(val) => updateField("isActive", val)}
                />
                <span className="text-sm text-natural-100">نشط</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={formData.isDefault}
                  onCheckedChange={(val) =>
                    updateField("isDefault", Boolean(val))
                  }
                />
                <span className="text-sm text-natural-100">
                  العملة الافتراضية
                </span>
              </label>
            </div>
            {formData.isDefault && (
              <p className="mt-2 text-xs text-amber-600">
                سيتم إلغاء تعيين العملة الافتراضية الحالية تلقائياً
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Live preview */}
      <LivePreview data={formData} />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <ActionButton
          variant="outline"
          onClick={handleCancel}
          icon={<Ban className="size-4" />}
        >
          إلغاء
        </ActionButton>
        <ActionButton
          variant="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          icon={<Save className="size-4" />}
        >
          {mode === "create" ? "إضافة العملة" : "حفظ التغييرات"}
        </ActionButton>
      </div>
    </div>
  );
}
