"use client";

import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Cpu,
  Edit,
  Plus,
  RefreshCw,
  ServerCog,
  Sparkles,
  TestTube2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { ModelPicker } from "@/components/dashboard/admin/ai/ModelPicker";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCreateAiProviderMutation,
  useDeleteAiProviderMutation,
  useGetAiProvidersQuery,
  usePreviewAiProviderModelsMutation,
  useTestAiProviderMutation,
  useUpdateAiProviderMutation,
  type AiProvider,
  type CreateAiProviderDto,
  type UpdateAiProviderDto,
} from "@/features/admin/adminApi";
import { adminErrorMessage } from "@/lib/i18n";

const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini"],
  anthropic: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"],
  google: ["gemini-1.5-pro", "gemini-1.5-flash"],
};

type FormState = {
  name: string;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  priority: string;
  isActive: boolean;
  maxTokens: string;
  temperature: string;
};

const emptyForm: FormState = {
  name: "openai",
  displayName: "",
  baseUrl: "",
  apiKey: "",
  models: [],
  priority: "1",
  isActive: true,
  maxTokens: "",
  temperature: "",
};

function formFromProvider(provider: AiProvider): FormState {
  return {
    name: provider.name,
    displayName: provider.displayName ?? "",
    baseUrl: provider.baseUrl ?? "",
    apiKey: "",
    models: provider.models ?? [],
    priority: String(provider.priority),
    isActive: provider.isActive,
    maxTokens: provider.maxTokens == null ? "" : String(provider.maxTokens),
    temperature: provider.temperature == null ? "" : String(provider.temperature),
  };
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageHeader title="إعدادات الذكاء الاصطناعي" description="جارٍ تحميل مزودي الذكاء الاصطناعي." icon={Sparkles} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}><CardHeader className="gap-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56" /></CardHeader><CardContent className="flex flex-col gap-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

function ProviderDialog({ provider, open, onOpenChange }: { provider: AiProvider | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState<FormState>(() => provider ? formFromProvider(provider) : emptyForm);
  const [create, createState] = useCreateAiProviderMutation();
  const [update, updateState] = useUpdateAiProviderMutation();
  const [previewModels] = usePreviewAiProviderModelsMutation();

  const isEditing = provider !== null;
  const isSaving = createState.isLoading || updateState.isLoading;
  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setForm(provider ? formFromProvider(provider) : { ...emptyForm });
    onOpenChange(nextOpen);
  }

  async function handleFetch(type: string, key: string, baseUrl?: string) {
    return previewModels({ name: type, apiKey: key, baseUrl }).unwrap();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const common = {
      displayName: form.displayName || undefined,
      baseUrl: form.baseUrl || undefined,
      models: form.models,
      priority: Number(form.priority) || 1,
      isActive: form.isActive,
      maxTokens: form.maxTokens ? Number(form.maxTokens) : undefined,
      temperature: form.temperature ? Number(form.temperature) : undefined,
    };
    try {
      if (isEditing) {
        const body: UpdateAiProviderDto = { ...common, ...(form.apiKey ? { apiKey: form.apiKey } : {}) };
        await update({ id: provider.id, body }).unwrap();
      } else {
        if (!form.apiKey.trim()) { toast.error("أدخل مفتاح API أولاً"); return; }
        const body: CreateAiProviderDto = { name: form.name.trim(), apiKey: form.apiKey.trim(), ...common };
        await create(body).unwrap();
      }
      toast.success(isEditing ? "تم تحديث المزود بنجاح" : "تمت إضافة المزود بنجاح");
      onOpenChange(false);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }

  const defaults = DEFAULT_MODELS[form.name.toLowerCase()] ?? [];
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" dir="rtl">
        <DialogHeader><DialogTitle>{isEditing ? "تعديل مزود الذكاء الاصطناعي" : "إضافة مزود جديد"}</DialogTitle><DialogDescription>اضبط بيانات الاتصال والنماذج التي يمكن للنظام استخدامها.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2"><Label htmlFor="ai-provider-name">معرّف المزود</Label><Input id="ai-provider-name" value={form.name} disabled={isEditing} onChange={(event) => updateField("name", event.target.value)} placeholder="openai" /></div>
            <div className="flex flex-col gap-2"><Label htmlFor="ai-provider-display-name">الاسم المعروض</Label><Input id="ai-provider-display-name" value={form.displayName} onChange={(event) => updateField("displayName", event.target.value)} placeholder="OpenAI" /></div>
            <div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor="ai-provider-key">مفتاح API {isEditing ? "(اتركه فارغاً للإبقاء على المفتاح الحالي)" : ""}</Label><Input id="ai-provider-key" dir="ltr" type="password" value={form.apiKey} onChange={(event) => updateField("apiKey", event.target.value)} placeholder={isEditing ? "••••••••" : "sk-..."} /></div>
            <div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor="ai-provider-url">الرابط الأساسي (اختياري)</Label><Input id="ai-provider-url" dir="ltr" value={form.baseUrl} onChange={(event) => updateField("baseUrl", event.target.value)} placeholder="https://api.example.com/v1" /></div>
            <div className="flex flex-col gap-2"><Label htmlFor="ai-provider-priority">الأولوية</Label><Input id="ai-provider-priority" type="number" min="1" value={form.priority} onChange={(event) => updateField("priority", event.target.value)} /></div>
            <div className="flex items-center gap-3 pt-7"><Switch id="ai-provider-active" checked={form.isActive} onCheckedChange={(value) => updateField("isActive", value)} /><Label htmlFor="ai-provider-active">مزود نشط</Label></div>
          </div>
          <ModelPicker providerType={form.name} apiKey={form.apiKey} baseUrl={form.baseUrl || undefined} selected={form.models} defaultModels={defaults} onChange={(models) => updateField("models", models)} onFetch={handleFetch} />
          <div className="grid gap-4 sm:grid-cols-2"><div className="flex flex-col gap-2"><Label htmlFor="ai-max-tokens">الحد الأقصى للتوكنات</Label><Input id="ai-max-tokens" type="number" min="1" value={form.maxTokens} onChange={(event) => updateField("maxTokens", event.target.value)} /></div><div className="flex flex-col gap-2"><Label htmlFor="ai-temperature">درجة الحرارة</Label><Input id="ai-temperature" type="number" min="0" max="2" step="0.1" value={form.temperature} onChange={(event) => updateField("temperature", event.target.value)} /></div></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button><Button type="submit" disabled={isSaving}>{isSaving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AiPage() {
  const query = useGetAiProvidersQuery();
  const [testProvider, testState] = useTestAiProviderMutation();
  const [deleteProvider, deleteState] = useDeleteAiProviderMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<AiProvider | null>(null);

  function openCreate() { setSelectedProvider(null); setDialogOpen(true); }
  function openEdit(provider: AiProvider) { setSelectedProvider(provider); setDialogOpen(true); }
  async function handleTest(provider: AiProvider) {
    try {
      const result = await testProvider(provider.id).unwrap();
      if (result.success) toast.success("تم اختبار الاتصال بالمزود بنجاح");
      else toast.error("تعذر اختبار الاتصال بالمزود");
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }
  async function handleDelete() { if (!providerToDelete) return; try { await deleteProvider(providerToDelete.id).unwrap(); toast.success("تم حذف المزود بنجاح"); setProviderToDelete(null); } catch (error) { toast.error(adminErrorMessage(error)); } }

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <div className="flex flex-col gap-6" dir="rtl"><PageHeader title="إعدادات الذكاء الاصطناعي" description="تعذر تحميل مزودي الذكاء الاصطناعي." icon={Sparkles} /><Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><ServerCog /></EmptyMedia><EmptyHeader><EmptyTitle>تعذر تحميل المزودين</EmptyTitle><EmptyDescription>{adminErrorMessage(query.error)}</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => query.refetch()}>إعادة المحاولة</Button></EmptyContent></Empty></CardContent></Card></div>;

  const providers = query.data ?? [];
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageHeader title="إعدادات الذكاء الاصطناعي" description="إدارة مزودي الذكاء الاصطناعي والنماذج المتاحة للمساعد." icon={Sparkles} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw data-icon="inline-start" />{query.isFetching ? "جاري التحديث" : "تحديث"}</Button><Button onClick={openCreate}><Plus data-icon="inline-start" />إضافة مزود</Button></div>} />
      {providers.length === 0 ? <Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><Cpu /></EmptyMedia><EmptyHeader><EmptyTitle>لا يوجد مزودون بعد</EmptyTitle><EmptyDescription>أضف أول مزود للبدء باستخدام ميزات الذكاء الاصطناعي.</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={openCreate}><Plus data-icon="inline-start" />إضافة مزود</Button></EmptyContent></Empty></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{providers.map((provider) => <Card key={provider.id} className="flex flex-col"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Cpu />{provider.displayName || provider.name}</CardTitle><CardDescription className="mt-2 font-mono text-xs" dir="ltr">{provider.name}</CardDescription></div><Badge variant={provider.isActive ? "secondary" : "outline"}>{provider.isActive ? "نشط" : "متوقف"}</Badge></div></CardHeader><CardContent className="flex flex-1 flex-col gap-3"><div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 />{provider.models?.length ?? 0} نموذج محدد</div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">الأولوية</span><span>{provider.priority}</span></div><div className="flex flex-wrap gap-1">{(provider.models ?? []).slice(0, 3).map((model) => <Badge key={model} variant="outline" className="font-mono text-xs">{model}</Badge>)}{(provider.models ?? []).length > 3 ? <Badge variant="outline">+{provider.models.length - 3}</Badge> : null}</div></CardContent><CardFooter className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void handleTest(provider)} disabled={testState.isLoading}><TestTube2 data-icon="inline-start" />اختبار الاتصال</Button><Button variant="outline" size="sm" onClick={() => openEdit(provider)}><Edit data-icon="inline-start" />تعديل</Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => setProviderToDelete(provider)}><Trash2 data-icon="inline-start" />حذف</Button></CardFooter></Card>)}</div>}
      <ProviderDialog key={selectedProvider?.id ?? "create"} provider={selectedProvider} open={dialogOpen} onOpenChange={setDialogOpen} />
      <AlertDialog open={providerToDelete !== null} onOpenChange={(open) => { if (!open) setProviderToDelete(null); }}><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف مزود الذكاء الاصطناعي؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف إعدادات هذا المزود ولا يمكن التراجع عن العملية.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction disabled={deleteState.isLoading} onClick={(event) => { event.preventDefault(); void handleDelete(); }}>{deleteState.isLoading ? "جارٍ الحذف..." : "تأكيد الحذف"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
