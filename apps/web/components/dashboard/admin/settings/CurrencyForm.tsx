"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, Ban, Eye, Loader2, Save, Upload, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { toast } from "sonner";
import {
  useCreateCurrencySettingMutation,
  useUpdateCurrencySettingMutation,
  useUploadSvgMutation,
  type CurrencySetting,
  type CurrencySymbolType,
  type CreateCurrencySettingRequest,
  type UpdateCurrencySettingRequest,
} from "@/features/settings/settingsApi";
import type { CurrencyConfig } from "@/hooks/useCurrency";

const symbolTypes: ReadonlyArray<{ value: CurrencySymbolType; label: string }> = [
  { value: "TEXT", label: "نص" },
  { value: "SVG_URL", label: "رابط SVG" },
  { value: "SVG_UPLOAD", label: "رفع SVG" },
  { value: "SVG_INLINE", label: "كود SVG مضمن" },
];

const currencyTextFields: Array<"code" | "name" | "symbol"> = ["code", "name", "symbol"];

const currencySchema = z
  .object({
    code: z.string().trim().min(2, "رمز العملة مطلوب (حرفان على الأقل)."),
    name: z.string().trim().min(1, "اسم العملة مطلوب."),
    symbol: z.string().trim().min(1, "الترميز مطلوب."),
    symbolType: z.enum(["TEXT", "SVG_URL", "SVG_UPLOAD", "SVG_INLINE"]),
    svgKey: z.string().trim(),
    svgWidth: z.number().positive("أبعاد SVG يجب أن تكون أكبر من 0.").optional(),
    svgHeight: z.number().positive("أبعاد SVG يجب أن تكون أكبر من 0.").optional(),
    exchangeRate: z.number().positive("سعر الصرف يجب أن يكون أكبر من 0."),
    isActive: z.boolean(),
    isDefault: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.symbolType === "SVG_URL") {
      const isAbsoluteUrl = /^https?:\/\//i.test(value.svgKey);
      const isRelativeUrl = value.svgKey.startsWith("/");
      if (!value.svgKey || (!isAbsoluteUrl && !isRelativeUrl)) {
        ctx.addIssue({ code: "custom", path: ["svgKey"], message: "أدخل رابط SVG صالحاً." });
      }
    }
    if (value.symbolType === "SVG_UPLOAD" && !value.svgKey) {
      ctx.addIssue({ code: "custom", path: ["svgKey"], message: "يرجى توفير مرجع الملف المرفوع." });
    }
    if (value.symbolType === "SVG_UPLOAD" && /^(https?:\/\/|data:|javascript:|vbscript:)/i.test(value.svgKey)) {
      ctx.addIssue({ code: "custom", path: ["svgKey"], message: "مرجع ملف SVG المرفوع غير صالح." });
    }
    if (value.symbolType === "SVG_INLINE" && !value.svgKey) {
      ctx.addIssue({ code: "custom", path: ["svgKey"], message: "يرجى توفير محتوى SVG." });
    }
    if (value.symbolType === "SVG_INLINE" && value.svgKey && !/<svg\b/i.test(value.svgKey)) {
      ctx.addIssue({ code: "custom", path: ["svgKey"], message: "يجب أن يحتوي الكود على عنصر SVG صالح." });
    }
  });

type CurrencyFormData = z.infer<typeof currencySchema>;

interface CurrencyFormProps {
  initialData?: CurrencySetting;
  mode: "create" | "edit";
  onSuccess?: (currency: CurrencySetting) => void;
  onCancel?: () => void;
}

const validationMessages: Record<string, string> = {
  CURRENCY_CODE_REQUIRED: "رمز العملة مطلوب (حرفان على الأقل).",
  CURRENCY_NAME_REQUIRED: "اسم العملة مطلوب.",
  CURRENCY_SYMBOL_REQUIRED: "الترميز مطلوب.",
  EXCHANGE_RATE_INVALID: "سعر الصرف يجب أن يكون أكبر من 0.",
  SVG_URL_INVALID: "أدخل رابط SVG صالحاً.",
  SVG_SOURCE_REQUIRED: "يرجى توفير مصدر SVG.",
  SVG_CONTENT_REQUIRED: "يرجى توفير محتوى SVG.",
  SVG_REFERENCE_REQUIRED: "يرجى توفير مرجع الملف المرفوع.",
  SVG_REFERENCE_INVALID: "مرجع ملف SVG المرفوع غير صالح.",
  SVG_INLINE_INVALID: "يجب أن يحتوي الكود على عنصر SVG صالح.",
  SVG_DIMENSION_INVALID: "أبعاد SVG يجب أن تكون أكبر من 0.",
  FILE_TYPE_NOT_ALLOWED: "نوع الملف غير مسموح.",
  SVG_TYPE_NOT_ALLOWED: "يسمح برفع ملفات SVG فقط.",
  SVG_TOO_LARGE: "حجم ملف SVG أكبر من الحد المسموح.",
};

function messageFor(code?: string) {
  return (code && validationMessages[code]) || (code ? adminErrorMessage({ data: { error: { code } } }) : "تحقق من البيانات المدخلة.");
}

function previewCurrency(data: CurrencyFormData, uploadedUrl?: string): CurrencyConfig {
  return {
    code: data.code || "---",
    name: data.name || "---",
    symbol: data.symbol || "---",
    symbolType: data.symbolType,
    svgKey: data.svgKey || null,
    svgUrl: uploadedUrl || null,
    svgWidth: data.svgWidth || 24,
    svgHeight: data.svgHeight || 20,
    isDefault: data.isDefault,
    exchangeRate: data.exchangeRate || 1,
  };
}

function LivePreview({ data, uploadedUrl }: { data: CurrencyFormData; uploadedUrl?: string }) {
  const currency = previewCurrency(data, uploadedUrl);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Eye aria-hidden="true" />معاينة مباشرة</CardTitle>
        <CardDescription>تظهر المعاينة وفق البيانات الحالية.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div><p className="text-sm text-muted-foreground">الرمز</p><p className="text-xl font-bold">{currency.code}</p></div>
          <div><p className="text-sm text-muted-foreground">الاسم</p><p className="text-xl">{currency.name}</p></div>
          <div className="flex items-center gap-2"><SymbolRenderer currency={currency} width={32} height={32} /><span className="text-xl">{currency.symbol}</span></div>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">معاينة المبلغ</p>
          {[1500, 25000.5, 99.99].map((amount) => (
            <div key={amount} className="flex items-center gap-2"><span className="text-lg">{formatNumber(amount, "ar-SA-u-nu-latn")}</span><SymbolRenderer currency={currency} width={22} height={22} /></div>
          ))}
        </div>
        {data.isDefault ? <Alert><AlertCircle aria-hidden="true" /><AlertTitle>العملة الافتراضية</AlertTitle><AlertDescription>سيتم إلغاء تعيين العملة الافتراضية الحالية تلقائياً.</AlertDescription></Alert> : null}
      </CardContent>
    </Card>
  );
}

export default function CurrencyForm({ initialData, mode, onSuccess, onCancel }: CurrencyFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string>();
  // For uploads this is presentation-only: it can be a local object URL while
  // uploading or the signed svgUrl returned by the API. svgKey remains the
  // durable reference sent to create/update.
  const [uploadPreview, setUploadPreview] = useState<string>(() => initialData?.svgUrl ?? "");
  const [createCurrency, { isLoading: isCreating }] = useCreateCurrencySettingMutation();
  const [updateCurrency, { isLoading: isUpdating }] = useUpdateCurrencySettingMutation();
  const [uploadSvg, { isLoading: isUploading }] = useUploadSvgMutation();
  const form = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      code: initialData?.code ?? "", name: initialData?.name ?? "", symbol: initialData?.symbol ?? "",
      symbolType: initialData?.symbolType ?? "TEXT", svgKey: initialData?.svgKey ?? "",
      svgWidth: initialData?.svgWidth ?? 24, svgHeight: initialData?.svgHeight ?? 20, exchangeRate: initialData?.exchangeRate ?? 1,
      isActive: initialData?.isActive ?? true, isDefault: initialData?.isDefault ?? false,
    },
  });
  const values = form.watch();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => () => {
    // Never revoke a backend URL; only local previews are owned by this form.
    if (uploadPreview.startsWith("blob:")) URL.revokeObjectURL(uploadPreview);
  }, [uploadPreview]);

  const handleSubmit: SubmitHandler<CurrencyFormData> = async (data) => {
    // The API DTO uses svgKey as the source for URL/inline content or the
    // durable storage reference for SVG_UPLOAD. A preview URL is never sent.
    const source = data.symbolType === "TEXT" ? "" : data.svgKey.trim();
    const body = {
      code: data.code.trim(),
      name: data.name.trim(),
      symbol: data.symbol.trim(),
      symbolType: data.symbolType,
      svgKey: source,
      ...(data.symbolType === "TEXT"
        ? {}
        : { svgWidth: data.svgWidth, svgHeight: data.svgHeight }),
      exchangeRate: data.exchangeRate,
      isActive: data.isActive,
      isDefault: data.isDefault,
    };
    try {
      const result = mode === "create"
        ? await createCurrency(body satisfies CreateCurrencySettingRequest).unwrap()
        : await updateCurrency({ id: initialData!.id, body: body satisfies UpdateCurrencySettingRequest }).unwrap();
      toast.success(adminSuccessMessage(mode === "create" ? "CURRENCY_CREATED" : "CURRENCY_UPDATED"));
      onSuccess?.(result);
      if (!onSuccess) router.push("/dashboard/admin/settings/currencies");
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(undefined);
    if (file.type !== "image/svg+xml" && !file.name.toLowerCase().endsWith(".svg")) {
      setUploadError(messageFor("FILE_TYPE_NOT_ALLOWED"));
      return;
    }
    const previousPreview = uploadPreview;
    setUploadPreview(URL.createObjectURL(file));
    try {
      const result = await uploadSvg({ file }).unwrap();
      // Persist the durable storage reference; use the returned URL only for preview.
      const uploadedReference = result.reference;
      if (!uploadedReference) {
        setUploadPreview(previousPreview);
        setUploadError(messageFor("SVG_UPLOAD_REFERENCE_MISSING"));
        return;
      }
      setUploadPreview(result.url);
      form.setValue("svgKey", uploadedReference, { shouldValidate: true, shouldDirty: true });
      toast.success(adminSuccessMessage("SVG_UPLOADED"));
    } catch (error) {
      // A failed replacement must not discard the existing durable upload.
      setUploadPreview(previousPreview);
      setUploadError(adminErrorMessage(error));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function cancel() {
    onCancel?.();
    if (!onCancel) router.push("/dashboard/admin/settings/currencies");
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6" noValidate>
          <Card>
            <CardHeader><CardTitle>{mode === "create" ? "إضافة عملة جديدة" : "تعديل العملة"}</CardTitle><CardDescription>أدخل معلومات العملة وإعدادات عرضها.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {currencyTextFields.map((name) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem><FormLabel>{name === "code" ? "رمز العملة" : name === "name" ? "اسم العملة" : "الترميز"}</FormLabel><FormControl><Input placeholder={name === "code" ? "مثال: USD" : name === "name" ? "مثال: دولار أمريكي" : "مثال: $"} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                ))}
              </div>
              <FormField control={form.control} name="symbolType" render={({ field }) => (
                <FormItem><FormLabel>نوع الترميز</FormLabel><Select value={field.value} onValueChange={(value) => {
                  field.onChange(value);
                  // A source belongs to one symbol type. Clearing it here also
                  // clears an old upload when editing and switching types.
                  form.setValue("svgKey", "", { shouldValidate: true, shouldDirty: true });
                  setUploadPreview("");
                  setUploadError(undefined);
                }}><FormControl><SelectTrigger><SelectValue placeholder="اختر نوع الترميز" /></SelectTrigger></FormControl><SelectContent><SelectGroup>{symbolTypes.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent></Select><FormMessage /></FormItem>
              )} />
              {values.symbolType === "SVG_URL" ? <FormField control={form.control} name="svgKey" render={({ field }) => <FormItem><FormLabel>رابط ملف SVG</FormLabel><FormControl><Input type="url" placeholder="https://example.com/icon.svg" {...field} /></FormControl><FormMessage /></FormItem>} /> : null}
              {values.symbolType === "SVG_INLINE" ? <FormField control={form.control} name="svgKey" render={({ field }) => <FormItem><FormLabel>كود SVG المضمن</FormLabel><FormControl><Textarea placeholder="<svg ...>...</svg>" rows={6} {...field} /></FormControl><FormMessage /></FormItem>} /> : null}
              {values.symbolType === "SVG_UPLOAD" ? <FormField control={form.control} name="svgKey" render={() => <FormItem><FormLabel htmlFor="currency-svg-upload">ملف SVG</FormLabel><input ref={fileInputRef} id="currency-svg-upload" type="file" accept="image/svg+xml,.svg" className="sr-only" aria-describedby={uploadError ? "currency-upload-error" : undefined} aria-invalid={Boolean(uploadError)} onChange={handleFileUpload} /><div className="flex flex-wrap items-center gap-3"><Button type="button" variant="outline" className="min-h-11" onClick={() => fileInputRef.current?.click()} disabled={isUploading}><Upload data-icon="inline-start" />{isUploading ? <><Loader2 data-icon="inline-start" className="animate-spin" />جارٍ الرفع</> : "اختيار ملف"}</Button>{values.svgKey ? <div className="flex items-center gap-2 text-sm text-muted-foreground">{uploadPreview ? <img src={uploadPreview} alt="معاينة ملف SVG" className="size-8 object-contain" /> : null}<span>تم رفع الملف</span><Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={() => { form.setValue("svgKey", "", { shouldValidate: true }); setUploadPreview(""); }} aria-label="إزالة ملف SVG"><X data-icon="inline-start" /></Button></div> : null}</div>{uploadError ? <Alert id="currency-upload-error" variant="destructive"><AlertCircle aria-hidden="true" /><AlertDescription>{uploadError}</AlertDescription></Alert> : null}<FormMessage /></FormItem>} /> : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField control={form.control} name="exchangeRate" render={({ field }) => <FormItem><FormLabel>سعر الصرف</FormLabel><FormControl><Input type="number" min="0" step="0.0001" {...field} onChange={(event) => field.onChange(event.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>} />
                <div className="flex flex-col justify-end gap-3"><FormField control={form.control} name="isActive" render={({ field }) => <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>نشط</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} /><FormField control={form.control} name="isDefault" render={({ field }) => <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>العملة الافتراضية</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} /></div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-3"><Button type="button" variant="outline" className="min-h-11" onClick={cancel}><Ban data-icon="inline-start" />إلغاء</Button><Button type="submit" className="min-h-11" disabled={isSubmitting || isUploading}>{isSubmitting ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}{mode === "create" ? "إضافة العملة" : "حفظ التغييرات"}</Button></CardFooter>
          </Card>
        </form>
      </Form>
      <LivePreview data={values} uploadedUrl={uploadPreview} />
    </div>
  );
}
