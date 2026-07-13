"use client";

import { useState } from "react";
import {
  Bot, Plus, Trash2, TestTube, Wifi, WifiOff, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  useGetAiProvidersQuery,
  useCreateAiProviderMutation,
  useUpdateAiProviderMutation,
  useDeleteAiProviderMutation,
  useTestAiProviderMutation,
  type AiProvider,
  type CreateAiProviderDto,
} from "@/features/admin/adminApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { FormInput } from "@/components/design-system/FormInput";
import { PageIntro } from "@/components/design-system/PageIntro";

const ADAPTER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "google", label: "Google (Gemini)" },
];

const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini"],
  openrouter: ["openai/gpt-4o", "anthropic/claude-sonnet-4", "google/gemini-2.0-flash"],
  anthropic: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro"],
};

export default function AiSettingsPage() {
  const { data: providers, isLoading } = useGetAiProvidersQuery();
  const [createProvider] = useCreateAiProviderMutation();
  const [updateProvider] = useUpdateAiProviderMutation();
  const [deleteProvider] = useDeleteAiProviderMutation();
  const [testProvider] = useTestAiProviderMutation();
  const [showForm, setShowForm] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const dto: CreateAiProviderDto = {
      name,
      displayName: (form.get("displayName") as string) || undefined,
      baseUrl: (form.get("baseUrl") as string) || undefined,
      apiKey: form.get("apiKey") as string,
      models: DEFAULT_MODELS[name] || [],
      priority: providers?.length ?? 0,
      requestsPerMinute: Number(form.get("requestsPerMinute")) || 60,
      tokensPerMinute: Number(form.get("tokensPerMinute")) || 100000,
    };
    await createProvider(dto);
    setShowForm(false);
  }

  async function handleTest(id: string) {
    setTestingId(id);
    try {
      const res = await testProvider(id).unwrap();
      setTestResults((prev) => ({
        ...prev,
        [id]: res.success
          ? `✅ ${res.model}: ${res.response?.trim().slice(0, 50)}`
          : `❌ ${res.message}`,
      }));
    } catch {
      setTestResults((prev) => ({ ...prev, [id]: "❌ فشل الاتصال" }));
    }
    setTestingId(null);
  }

  async function handleToggleActive(provider: AiProvider) {
    await updateProvider({ id: provider.id, body: { isActive: !provider.isActive } });
  }

  async function handleDelete(id: string) {
    await deleteProvider(id);
  }

  async function handlePriority(provider: AiProvider, dir: "up" | "down") {
    if (!providers) return;
    const idx = providers.findIndex((p) => p.id === provider.id);
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= providers.length) return;
    const target = providers[targetIdx];
    await updateProvider({ id: provider.id, body: { priority: target.priority } });
    await updateProvider({ id: target.id, body: { priority: provider.priority } });
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الذكاء الاصطناعي"
        description="إدارة مزودي الذكاء الاصطناعي — أضف مفتاح API وسيتم استخدامه تلقائياً"
        icon={Bot}
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 h-10 px-4 bg-secondary-500 text-white rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            إضافة مزود
          </button>
        }
      />

      {showForm && (
        <SurfaceCard title="إضافة مزود جديد" icon={Plus}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="النوع" name="name" required options={ADAPTER_OPTIONS} />
              <FormInput label="الاسم المعروض" name="displayName" placeholder="مثال: OpenRouter الأساسي" />
              <FormInput label="رابط API (اختياري)" name="baseUrl" placeholder="https://api.openai.com/v1" />
              <FormInput label="مفتاح API" name="apiKey" required type="password" showPasswordToggle placeholder="sk-..." />
              <FormInput label="الحد الأقصى للطلبات/الدقيقة" name="requestsPerMinute" type="number" defaultValue="60" />
              <FormInput label="الحد الأقصى للتوكنز/الدقيقة" name="tokensPerMinute" type="number" defaultValue="100000" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="h-10 px-4 text-sm text-portal-note-text hover:text-natural-100">
                إلغاء
              </button>
              <button type="submit" className="h-10 px-6 bg-secondary-500 text-white rounded-xl text-sm hover:opacity-90 transition-opacity">
                حفظ
              </button>
            </div>
          </form>
        </SurfaceCard>
      )}

      <SurfaceCard title="المزودون" icon={Bot}>
        {isLoading ? (
          <div className="text-center py-12 text-portal-note-text">جاري التحميل...</div>
        ) : !providers?.length ? (
          <div className="text-center py-12 text-portal-note-text">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>لم يتم إضافة أي مزود بعد</p>
            <p className="text-sm">أضف مزوداً للبدء باستخدام الذكاء الاصطناعي</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-portal-divider">
                  <th className="py-3 px-4 text-right text-portal-note-text font-medium">#</th>
                  <th className="py-3 px-4 text-right text-portal-note-text font-medium">المزود</th>
                  <th className="py-3 px-4 text-right text-portal-note-text font-medium">الحالة</th>
                  <th className="py-3 px-4 text-right text-portal-note-text font-medium">النماذج</th>
                  <th className="py-3 px-4 text-right text-portal-note-text font-medium">الحدود</th>
                  <th className="py-3 px-4 text-right text-portal-note-text font-medium">اختبار</th>
                  <th className="py-3 px-4 text-right text-portal-note-text font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider, idx) => (
                  <tr key={provider.id} className="border-b border-portal-divider last:border-0 hover:bg-badge-gray-bg transition-colors">
                    <td className="py-3 px-4 text-portal-note-text whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-natural-100">{idx + 1}</span>
                        <div className="flex flex-col">
                          {idx > 0 && (
                            <button onClick={() => handlePriority(provider, "up")} className="text-portal-note-text hover:text-natural-100 leading-none">
                              <ChevronUp className="w-3 h-3" />
                            </button>
                          )}
                          {idx < providers.length - 1 && (
                            <button onClick={() => handlePriority(provider, "down")} className="text-portal-note-text hover:text-natural-100 leading-none">
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div>
                        <span className="text-secondary-500 font-medium">{provider.displayName || provider.name}</span>
                        {provider.baseUrl && (
                          <p className="text-xs text-portal-note-text mt-0.5 dir-ltr text-left">{provider.baseUrl}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          provider.isActive
                            ? "bg-success-100 text-success-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${provider.isActive ? "bg-success-500" : "bg-neutral-300"}`} />
                        {provider.isActive ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-portal-note-text max-w-[200px] truncate" title={provider.models.join(", ")}>
                      {provider.models.length > 0 ? provider.models.join("، ") : "—"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-portal-note-text">
                      <span className="text-xs">{provider.requestsPerMinute || "—"}/دقيقة</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTest(provider.id)}
                        disabled={testingId === provider.id}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-neutral-200 text-xs text-portal-note-text hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                      >
                        <TestTube className="w-3.5 h-3.5" />
                        {testingId === provider.id ? "..." : "اختبار"}
                      </button>
                      {testResults[provider.id] && testingId !== provider.id && (
                        <p className="text-xs mt-1 text-portal-note-text max-w-[200px] truncate">{testResults[provider.id]}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(provider)}
                          className={`p-2 rounded-lg border transition-colors ${
                            provider.isActive
                              ? "border-success-200 bg-success-50 text-success-600 hover:bg-success-100"
                              : "border-neutral-200 text-portal-note-text hover:bg-neutral-50"
                          }`}
                          title={provider.isActive ? "تعطيل" : "تفعيل"}
                        >
                          {provider.isActive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(provider.id)}
                          className="p-2 rounded-lg border border-neutral-200 text-portal-note-text hover:bg-danger-50 hover:text-danger-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}

function SelectField({ label, name, options, required }: {
  label: string; name: string; options: Array<{ value: string; label: string }>; required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-secondary-500 text-right">{label}</label>
      <select
        name={name}
        required={required}
        className="w-full h-12 px-4 text-sm text-secondary-500 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 transition-colors duration-200 text-right"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
