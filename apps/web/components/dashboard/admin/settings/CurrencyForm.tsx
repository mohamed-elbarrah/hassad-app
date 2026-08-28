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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  SymbolRenderer,
  type CurrencySymbolConfig,
} from "@/components/design-system/CurrencySymbol";
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


const symbolTypes: ReadonlyArray<{ value: CurrencySymbolType; label: string }> = [
  { value: "TEXT", label: "نص" },
  { value: "SVG_URL", label: "رابط SVG" },
  { value: "SVG_UPLOAD", label: "رفع SVG" },
  { value: "SVG_INLINE", label: "كود SVG مضمن" },
];

const currencyTextFields: Array<"code" | "name" | "symbol"> = ["code", "name", "symbol"];

function isSupportedSvgUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

const currencySchema = z
  .object({
    code: z.string().trim().min(2, "رمز العملة مطلوب (حرفان على الأقل)."),
    name: z.string().trim().min(1, "اسم العملة مطلوب."),
    symbol: z.string().trim().min(1, "الترميز مطلوب."),
    symbolType: z.enum(["TEXT", "SVG_URL", "SVG_UPLOAD", "SVG_INLINE"]),
    svgKey: z.string().trim(),
    svgWidth: z.number({ error: "أبعاد SVG يجب أن تكون أكبر من 0." }).positive("أبعاد SVG يجب أن تكون أكبر من 0.").optional(),
    svgHeight: z.number({ error: "أبعاد SVG يجب أن تكون أكبر من 0." }).positive("أبعاد SVG يجب أن تكون أكبر من 0.").optional(),
    exchangeRate: z.number({ error: "سعر الصرف يجب أن يكون أكبر من 0." }).positive("سعر الصرف يجب أن يكون أكبر من 0."),
    isActive: z.boolean(),
    isDefault: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.symbolType === "SVG_URL" && !isSupportedSvgUrl(value.svgKey)) {
      ctx.addIssue({ code: "custom", path: ["svgKey"], message: "أدخل رابط SVG صالحاً." });
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
  onBusyChange?: (busy: boolean) => void;
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

function previewCurrency(data: CurrencyFormData, uploadedUrl?: string): CurrencySymbolConfig & {
  code: string;
  name: string;
  isDefault: boolean;
  exchangeRate: number;
} {
  const isUpload = data.symbolType === "SVG_UPLOAD";
  return {
    code: data.code || "---",
    name: data.name || "---",
    symbol: data.symbol || "---",
    symbolType: data.symbolType,
    // Inline markup and external/upload sources have different meanings for
    // svgKey. Only expose the signed preview URL for an upload preview.
    svgKey: data.svgKey || null,
    svgUrl: isUpload ? uploadedUrl || null : null,
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

export default function CurrencyForm({ initialData, mode, onSuccess, onCancel, onBusyChange }: CurrencyFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRequestId = useRef(0);
  const [uploadFileName, setUploadFileName] = useState<string>();
  const [uploadInFlight, setUploadInFlight] = useState(false);
  // Upload previews are limited to the server-cleaned URL returned by the API.
  // While an upload is pending, the UI shows text instead of rendering the
  // local SVG file as an object URL.
  const [uploadPreview, setUploadPreview] = useState<string>(() =>
    initialData?.symbolType === "SVG_UPLOAD" ? initialData.svgUrl ?? "" : "",
  );
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
  const isUploadBusy = isUploading || uploadInFlight;
  const isBusy = isSubmitting || isUploadBusy;

  useEffect(() => {
    onBusyChange?.(isBusy);
  }, [isBusy, onBusyChange]);

  useEffect(() => {
    uploadRequestId.current += 1;
    form.reset({
      code: initialData?.code ?? "", name: initialData?.name ?? "", symbol: initialData?.symbol ?? "",
      symbolType: initialData?.symbolType ?? "TEXT", svgKey: initialData?.svgKey ?? "",
      svgWidth: initialData?.svgWidth ?? 24, svgHeight: initialData?.svgHeight ?? 20,
      exchangeRate: initialData?.exchangeRate ?? 1, isActive: initialData?.isActive ?? true,
      isDefault: initialData?.isDefault ?? false,
    });
    setUploadPreview(initialData?.symbolType === "SVG_UPLOAD" ? initialData.svgUrl ?? "" : "");
    setUploadFileName(undefined);
    form.clearErrors("svgKey");
  }, [form, initialData, mode]);

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
    form.clearErrors("svgKey");
    if (file.type !== "image/svg+xml" && !file.name.toLowerCase().endsWith(".svg")) {
      form.setError("svgKey", { type: "upload", message: messageFor("FILE_TYPE_NOT_ALLOWED") });
      event.target.value = "";
      return;
    }
    const previousPreview = uploadPreview;
    const previousFileName = uploadFileName;
    const requestId = ++uploadRequestId.current;
    // Notify the dialog before yielding to the mutation so Escape/close cannot
    // race the upload state update. Do not render the local SVG file: it has
    // not passed the server sanitizer yet.
    setUploadInFlight(true);
    setUploadPreview("");
    setUploadFileName(file.name);
    try {
      const result = await uploadSvg({ file }).unwrap();
      // Ignore a completion after the source has been reset or replaced.
      if (requestId !== uploadRequestId.current) return;
      // Persist the durable storage reference; use the server-cleaned URL only for preview.
      const uploadedReference = result.reference;
      if (!uploadedReference) {
        setUploadPreview(previousPreview);
        setUploadFileName(previousFileName);
        const message = messageFor("SVG_UPLOAD_REFERENCE_MISSING");
        form.setError("svgKey", { type: "upload", message });
        return;
      }
      setUploadPreview(result.url);
      form.setValue("svgKey", uploadedReference, { shouldValidate: true, shouldDirty: true });
      form.clearErrors("svgKey");
      toast.success(adminSuccessMessage("SVG_UPLOADED"));
    } catch (error) {
      if (requestId !== uploadRequestId.current) return;
      // A failed replacement must not discard the existing durable upload.
      setUploadPreview(previousPreview);
      setUploadFileName(previousFileName);
      const message = adminErrorMessage(error);
      form.setError("svgKey", { type: "upload", message });
    } finally {
      if (requestId === uploadRequestId.current) setUploadInFlight(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function cancel() {
    if (isBusy) return;
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
                    <FormItem><FormLabel>{name === "code" ? "رمز العملة" : name === "name" ? "اسم العملة" : "الترميز"}</FormLabel><FormControl><Input dir={name === "code" ? "ltr" : undefined} className={name === "code" ? "text-left uppercase" : undefined} placeholder={name === "code" ? "مثال: USD" : name === "name" ? "مثال: دولار أمريكي" : "مثال: $"} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                ))}
              </div>
              <FormField control={form.control} name="symbolType" render={({ field }) => (
                <FormItem><FormLabel>نوع الترميز</FormLabel><Select value={field.value} onValueChange={(value) => {
                  field.onChange(value);
                  // A source belongs to one symbol type. Clearing it here also
                  // clears an old upload when editing and switching types.
                  uploadRequestId.current += 1;
                  form.setValue("svgKey", "", { shouldValidate: true, shouldDirty: true });
                  setUploadPreview("");
                  setUploadFileName(undefined);
                  form.clearErrors("svgKey");
                }} disabled={isBusy}><FormControl><SelectTrigger disabled={isBusy}><SelectValue placeholder="اختر نوع الترميز" /></SelectTrigger></FormControl><SelectContent><SelectGroup>{symbolTypes.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent></Select><FormMessage /></FormItem>
              )} />
              {values.symbolType === "SVG_URL" ? <FormField control={form.control} name="svgKey" render={({ field }) => <FormItem><FormLabel>رابط ملف SVG</FormLabel><FormControl><Input dir="ltr" className="text-left" type="url" placeholder="https://example.com/icon.svg" {...field} /></FormControl><FormMessage /></FormItem>} /> : null}
              {values.symbolType === "SVG_INLINE" ? <FormField control={form.control} name="svgKey" render={({ field }) => <FormItem><FormLabel>كود SVG المضمن</FormLabel><FormControl><Textarea dir="ltr" className="text-left font-mono" placeholder="<svg ...>...</svg>" rows={6} {...field} /></FormControl><FormMessage /></FormItem>} /> : null}
              {values.symbolType === "SVG_UPLOAD" ? <FormField control={form.control} name="svgKey" render={() => <FormItem><FormLabel htmlFor="currency-svg-upload">ملف SVG</FormLabel><FormControl><input ref={fileInputRef} id="currency-svg-upload" type="file" accept="image/svg+xml,.svg" className="sr-only" onChange={handleFileUpload} /></FormControl><FormDescription>اختر ملف SVG لرفعه ومعاينته قبل الحفظ.</FormDescription><div className="flex flex-wrap items-center gap-3"><Button type="button" variant="outline" className="min-h-11" onClick={() => fileInputRef.current?.click()} disabled={isBusy} aria-invalid={!!form.formState.errors.svgKey}>{isUploadBusy ? <><Loader2 data-icon="inline-start" className="animate-spin" />جارٍ رفع الملف…</> : <><Upload data-icon="inline-start" />اختيار ملف SVG</>}</Button>{values.svgKey ? <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite"><span className="flex size-8 shrink-0 items-center justify-center">{isUploadBusy ? <span aria-hidden="true">…</span> : uploadPreview ? <img src={uploadPreview} alt="معاينة ملف SVG" className="size-8 object-contain" /> : <span aria-hidden="true">✓</span>}</span><span dir="ltr" className="max-w-56 truncate text-left">{uploadFileName ?? "ملف SVG مرفوع"}</span><span className="sr-only">تم رفع الملف</span><Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={() => { uploadRequestId.current += 1; form.setValue("svgKey", "", { shouldValidate: true, shouldDirty: true }); setUploadPreview(""); setUploadFileName(undefined); }} disabled={isBusy} aria-label="إزالة ملف SVG"><X data-icon="inline-start" /></Button></div> : null}</div><FormMessage /></FormItem>} /> : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField control={form.control} name="exchangeRate" render={({ field }) => <FormItem><FormLabel>سعر الصرف</FormLabel><FormControl><Input dir="ltr" type="number" min="0" step="0.0001" {...field} onChange={(event) => field.onChange(event.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>} />
                <div className="flex flex-col justify-end gap-3"><FormField control={form.control} name="isActive" render={({ field }) => <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>نشط</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} /><FormField control={form.control} name="isDefault" render={({ field }) => <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>العملة الافتراضية</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} /></div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-3"><Button type="button" variant="outline" className="min-h-11" onClick={cancel} disabled={isBusy}><Ban data-icon="inline-start" />إلغاء</Button><Button type="submit" className="min-h-11" disabled={isBusy}>{isSubmitting ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}{mode === "create" ? "إضافة العملة" : "حفظ التغييرات"}</Button></CardFooter>
          </Card>
        </form>
      </Form>
      <LivePreview data={values} uploadedUrl={uploadPreview} />
    </div>
  );
}
