"use client";

import { useState, useCallback } from "react";
import {
  CircleDollarSign,
  Check,
  Trash2,
  Pencil,
  Plus,
  Globe,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetCurrencySettingsQuery,
  useCreateCurrencySettingMutation,
  useUpdateCurrencySettingMutation,
  useDeleteCurrencySettingMutation,
} from "@/features/settings/settingsApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Pill } from "@/components/design-system/Pill";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Dialog } from "@/components/design-system/Dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/design-system/Tabs";
import { cn } from "@/lib/utils";

type SymbolType = "TEXT" | "SVG_URL" | "SVG_INLINE";

interface CurrencyFormData {
  code: string; name: string; symbol: string; symbolType: SymbolType;
  svgKey: string; svgWidth: number; svgHeight: number;
  isDefault: boolean; isActive: boolean; exchangeRate: number;
}

const DEFAULT_FORM: CurrencyFormData = {
  code: "", name: "", symbol: "", symbolType: "TEXT",
  svgKey: "", svgWidth: 24, svgHeight: 24,
  isDefault: false, isActive: true, exchangeRate: 1,
};

const SYMBOL_TYPE_OPTIONS: { value: SymbolType; label: string; desc: string }[] = [
  { value: "TEXT", label: "نص", desc: "استخدم رمز نصي مثل ر.س أو $" },
  { value: "SVG_URL", label: "رابط SVG", desc: "أدخل رابط ملف SVG مستضاف" },
  { value: "SVG_INLINE", label: "SVG مضمن", desc: "أدخل كود SVG مباشر" },
];

export default function CurrencySettingsPage() {
  const { data: currencies, isLoading } = useGetCurrencySettingsQuery();
  const [createCurrency, { isLoading: creating }] = useCreateCurrencySettingMutation();
  const [updateCurrency, { isLoading: updating }] = useUpdateCurrencySettingMutation();
  const [deleteCurrency] = useDeleteCurrencySettingMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CurrencyFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CurrencyFormData, string>>>({});

  const resetForm = useCallback(() => { setForm(DEFAULT_FORM); setEditingId(null); setErrors({}); }, []);

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (currency: any) => {
    setForm({
      code: currency.code, name: currency.name, symbol: currency.symbol,
      symbolType: currency.symbolType, svgKey: currency.svgKey ?? "",
      svgWidth: currency.svgWidth ?? 24, svgHeight: currency.svgHeight ?? 24,
      isDefault: currency.isDefault, isActive: currency.isActive,
      exchangeRate: currency.exchangeRate,
    });
    setEditingId(currency.id); setErrors({}); setDialogOpen(true);
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.code.trim()) next.code = "رمز العملة مطلوب";
    else if (form.code.trim().length !== 3) next.code = "يجب أن يكون 3 حروف (ISO)";
    if (!form.name.trim()) next.name = "اسم العملة مطلوب";
    if (!form.symbol.trim()) next.symbol = "الرمز الظاهر مطلوب";
    if (form.symbolType !== "TEXT" && !form.svgKey.trim()) next.svgKey = "الرابط مطلوب عند اختيار SVG";
    if (form.exchangeRate <= 0) next.exchangeRate = "يجب أن يكون أكبر من صفر";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: any = {
      code: form.code.trim().toUpperCase(), name: form.name.trim(),
      symbol: form.symbol.trim(), symbolType: form.symbolType,
      exchangeRate: form.exchangeRate, isDefault: form.isDefault, isActive: form.isActive,
    };
    if (form.symbolType !== "TEXT") {
      payload.svgKey = form.svgKey.trim();
      payload.svgWidth = form.svgWidth; payload.svgHeight = form.svgHeight;
    }
    try {
      if (editingId) {
        await updateCurrency({ id: editingId, body: payload }).unwrap();
        toast.success("تم تحديث العملة بنجاح");
      } else {
        await createCurrency(payload).unwrap();
        toast.success("تم إضافة العملة بنجاح");
      }
      setDialogOpen(false); resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "حدث خطأ أثناء حفظ العملة");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه العملة؟ لا يمكن التراجع.")) return;
    try { await deleteCurrency(id).unwrap(); toast.success("تم حذف العملة"); }
    catch { toast.error("تعذر حذف العملة"); }
  };

  const previewAmount = 1250;
  const previewSymbol = form.symbol;
  const previewSvgUrl = form.symbolType === "SVG_URL" && form.svgKey.trim() ? form.svgKey.trim() : null;
  const currencyList = currencies ?? [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إعدادات العملة"
        description="تحديد العملة الافتراضية وإدارة العملات المدعومة في المنصة"
        icon={CircleDollarSign}
        actions={
          <ActionButton onClick={openCreate}>
            <Plus className="size-4 mr-1" />إضافة عملة
          </ActionButton>
        }
      />

      <DataTable
        columns={[
          { id: "code", label: "الرمز" },
          { id: "name", label: "الاسم" },
          { id: "symbol", label: "الرمز الظاهر" },
          { id: "type", label: "النوع" },
          { id: "rate", label: "سعر الصرف", align: "left" },
          { id: "status", label: "الحالة" },
          { id: "default", label: "افتراضي" },
          { id: "actions", label: "", width: "80px" },
        ]}
        data={currencyList}
        isLoading={isLoading}
        isError={false}
        emptyState={{
          icon: CircleDollarSign,
          message: "لا توجد عملات",
          hint: "أضف أول عملة إلى النظام",
        }}
        renderRow={(c: any) => (
          <tr key={c.id} className="border-b-[1.5px] border-portal-divider">
            <td className="px-5 py-4 text-base font-semibold text-natural-100">{c.code}</td>
            <td className="px-5 py-4 text-base text-natural-100">{c.name}</td>
            <td className="px-5 py-4">
              {c.symbolType === "TEXT" ? (
                <span className="font-bold text-lg">{c.symbol}</span>
              ) : c.symbolType === "SVG_URL" ? (
                <img src={c.svgKey} alt={c.symbol} width={c.svgWidth ?? 24} height={c.svgHeight ?? 24} className="inline-block object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span dangerouslySetInnerHTML={{ __html: c.svgKey }} className="inline-block" style={{ width: c.svgWidth ?? 24, height: c.svgHeight ?? 24 }} />
              )}
            </td>
            <td className="px-5 py-4">
              <Pill tone="neutral">{SYMBOL_TYPE_OPTIONS.find((o) => o.value === c.symbolType)?.label ?? c.symbolType}</Pill>
            </td>
            <td className="px-5 py-4 text-base font-mono text-natural-100 text-left">{c.exchangeRate}</td>
            <td className="px-5 py-4">
              <StatusBadge status={c.isActive ? "ACTIVE" : "STOPPED"} label={c.isActive ? "نشط" : "معطل"} />
            </td>
            <td className="px-5 py-4">
              {c.isDefault ? <Pill tone="warning"><Check className="h-3 w-3 mr-1" />افتراضي</Pill> : <span className="text-sm text-portal-note-text">—</span>}
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-0.5">
                <ActionButton variant="ghost" size="sm" className="h-8 w-8 text-portal-icon hover:text-natural-100" onClick={() => openEdit(c)}>
                  <Pencil className="size-4" />
                </ActionButton>
                <ActionButton variant="ghost" size="sm" className="h-8 w-8 text-portal-icon hover:text-danger-500" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="size-4" />
                </ActionButton>
              </div>
            </td>
          </tr>
        )}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "تعديل العملة" : "إضافة عملة جديدة"}
        description={editingId ? "عدّل بيانات العملة الحالية." : "أضف عملة جديدة وتحكم في ظهورها على المنصة."}
        contentClassName="sm:max-w-xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-natural-100">نوع الرمز الظاهر</Label>
            <Tabs value={form.symbolType} onValueChange={(v) => setForm((f) => ({ ...f, symbolType: v as SymbolType }))} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10">
                {SYMBOL_TYPE_OPTIONS.map((opt) => (
                  <TabsTrigger key={opt.value} value={opt.value} className="text-xs gap-1">
                    {opt.value === "TEXT" && <CreditCard className="h-3.5 w-3.5" />}
                    {opt.value === "SVG_URL" && <Globe className="h-3.5 w-3.5" />}
                    {opt.value === "SVG_INLINE" && <CircleDollarSign className="h-3.5 w-3.5" />}
                    {opt.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p className="text-xs text-portal-note-text">{SYMBOL_TYPE_OPTIONS.find((o) => o.value === form.symbolType)?.desc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-natural-100">رمز العملة <span className="text-danger-500">*</span></Label>
              <FormInputControl
                placeholder="SAR"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().slice(0, 3) }))}
                onBlur={() => setErrors((e) => ({ ...e, code: undefined }))}
                className={cn("h-10 text-center font-mono font-semibold tracking-wider", errors.code && "border-danger-500 focus-visible:ring-danger-500")}
                required
              />
              {errors.code ? (
                <span className="text-xs text-danger-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.code}</span>
              ) : (
                <span className="text-xs text-portal-note-text">3 حروف ISO 4217</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-natural-100">اسم العملة <span className="text-danger-500">*</span></Label>
              <FormInputControl
                placeholder="ريال سعودي"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onBlur={() => setErrors((e) => ({ ...e, name: undefined }))}
                className={cn("h-10", errors.name && "border-danger-500 focus-visible:ring-danger-500")}
                required
              />
              {errors.name && <span className="text-xs text-danger-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-natural-100">الرمز الظاهر <span className="text-danger-500">*</span></Label>
              <FormInputControl
                placeholder="مثال: ر.س  أو  $"
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                onBlur={() => setErrors((e) => ({ ...e, symbol: undefined }))}
                className={cn("h-10 text-center font-semibold", errors.symbol && "border-danger-500 focus-visible:ring-danger-500")}
                required
              />
              {errors.symbol && <span className="text-xs text-danger-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.symbol}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-natural-100">سعر الصرف</Label>
              <FormInputControl
                type="number" step="0.0001" min={0} placeholder="1.0000"
                value={form.exchangeRate}
                onChange={(e) => setForm((f) => ({ ...f, exchangeRate: parseFloat(e.target.value || "1") }))}
                onBlur={() => setErrors((e) => ({ ...e, exchangeRate: undefined }))}
                className={cn("h-10 font-mono", errors.exchangeRate && "border-danger-500 focus-visible:ring-danger-500")}
              />
              {errors.exchangeRate ? (
                <span className="text-xs text-danger-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.exchangeRate}</span>
              ) : (
                <span className="text-xs text-portal-note-text">مقارنة بالعملة الأساسية (1 = متساوي)</span>
              )}
            </div>
          </div>

          {form.symbolType !== "TEXT" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-natural-100">
                  {form.symbolType === "SVG_URL" ? "رابط ملف SVG" : "كود SVG"} <span className="text-danger-500">*</span>
                </Label>
                {form.symbolType === "SVG_URL" ? (
                  <FormInputControl
                    placeholder="https://example.com/symbol.svg"
                    value={form.svgKey}
                    onChange={(e) => setForm((f) => ({ ...f, svgKey: e.target.value }))}
                    onBlur={() => setErrors((e) => ({ ...e, svgKey: undefined }))}
                    className={cn("h-10 ltr-dir", errors.svgKey && "border-danger-500 focus-visible:ring-danger-500")}
                  />
                ) : (
                  <textarea
                    placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...></svg>'
                    value={form.svgKey}
                    onChange={(e) => setForm((f) => ({ ...f, svgKey: e.target.value }))}
                    onBlur={() => setErrors((e) => ({ ...e, svgKey: undefined }))}
                    rows={3}
                    className={cn("flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-neutral-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary-500/20 min-h-[80px] resize-y font-mono ltr-dir", errors.svgKey && "border-danger-500 focus-visible:ring-danger-500")}
                  />
                )}
                {errors.svgKey ? (
                  <span className="text-xs text-danger-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.svgKey}</span>
                ) : (
                  <span className="text-xs text-portal-note-text">
                    {form.symbolType === "SVG_URL" ? "يجب أن يكون عنوان URL صالحًا لملف SVG." : "أدخل شفرة SVG مباشرة (بدون <script> أو event handlers)."}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-natural-100">العرض (px)</Label>
                  <FormInputControl type="number" min={8} max={128} value={form.svgWidth} onChange={(e) => setForm((f) => ({ ...f, svgWidth: parseInt(e.target.value || "24", 10) }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-natural-100">الارتفاع (px)</Label>
                  <FormInputControl type="number" min={8} max={128} value={form.svgHeight} onChange={(e) => setForm((f) => ({ ...f, svgHeight: parseInt(e.target.value || "24", 10) }))} />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center gap-6 py-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div className={cn("w-11 h-6 rounded-full relative transition-colors", form.isActive ? "bg-success-500" : "bg-neutral-200")} onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}>
                <div className={cn("absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-transform duration-200", form.isActive ? "translate-x-5" : "")} />
              </div>
              <span className="text-sm font-medium text-natural-100">نشطة</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div className={cn("w-11 h-6 rounded-full relative transition-colors", form.isDefault ? "bg-alert-500" : "bg-neutral-200")} onClick={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))}>
                <div className={cn("absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-transform duration-200", form.isDefault ? "translate-x-5" : "")} />
              </div>
              <span className="text-sm font-medium text-natural-100">العملة الافتراضية</span>
            </label>
          </div>

          {form.isDefault && (
            <div className="rounded-2xl bg-alert-50 border border-alert-200 p-4 flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-alert-600 mt-0.5 shrink-0" />
              <p className="text-alert-800">سيتم تعيين هذه العملة كافتراضية لجميع العملاء في البوابة واستبدال العملة الافتراضية الحالية تلقائيًا.</p>
            </div>
          )}

          <div className="rounded-2xl border border-dashed border-portal-card-border bg-portal-bg p-4 flex flex-col items-center gap-2">
            <span className="text-xs text-portal-note-text mb-1">معاينة العرض</span>
            <div className="flex items-baseline gap-2">
              {form.symbolType === "SVG_URL" && previewSvgUrl ? (
                <>
                  <span className="text-2xl font-bold text-natural-100 tabular-nums">{previewAmount.toLocaleString("ar-SA-u-nu-latn")}</span>
                  <img src={previewSvgUrl} alt="symbol" width={form.svgWidth} height={form.svgHeight} className="object-contain inline-block" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </>
              ) : form.symbolType === "SVG_INLINE" && form.svgKey.trim() ? (
                <>
                  <span className="text-2xl font-bold text-natural-100 tabular-nums">{previewAmount.toLocaleString("ar-SA-u-nu-latn")}</span>
                  <span dangerouslySetInnerHTML={{ __html: form.svgKey.trim() }} className="inline-block" style={{ width: form.svgWidth, height: form.svgHeight, verticalAlign: "middle" }} />
                </>
              ) : (
                <span className="text-2xl font-bold text-natural-100 tabular-nums">
                  {previewAmount.toLocaleString("ar-SA-u-nu-latn")}<span className="mr-1.5"> </span>{previewSymbol || "؟"}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-1 border-t pt-4">
            <ActionButton variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>إلغاء</ActionButton>
            <ActionButton type="submit" disabled={creating || updating} className="min-w-[120px]">
              {creating || updating ? "جارٍ الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة العملة"}
            </ActionButton>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
