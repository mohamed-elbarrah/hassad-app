"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { BusinessType, ClientSource } from "@hassad/shared";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import { Checkbox } from "@/components/design-system/Checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { useCreateRequestForClientMutation } from "@/features/requests/requestsApi";
import { useCreateClientMutation, useGetClientsQuery } from "@/features/clients/clientsApi";
import { useGetServicesQuery } from "@/features/services/servicesApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Search,
  UserPlus,
  Users,
  ChevronLeft,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";

type ClientMode = "existing" | "new";

export default function NewOrderPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ClientMode>("existing");
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<{ id: string; companyName: string; user?: { name: string } | null } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const [createClient, { isLoading: isCreatingClient }] = useCreateClientMutation();
  const [createRequest, { isLoading: isCreatingRequest }] = useCreateRequestForClientMutation();
  const { data: services } = useGetServicesQuery(undefined);
  const { data: clientsData } = useGetClientsQuery(
    search.length >= 2 ? { search, limit: 10 } : { limit: 10 },
    { skip: mode !== "existing" },
  );

  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeServices = (services ?? []).filter((s) => s.isActive);
  const isSubmitting = isCreatingClient || isCreatingRequest;

  const filteredClients = clientsData?.items ?? [];

  const handleSelectClient = useCallback((client: { id: string; companyName: string; user?: { name: string } | null }) => {
    setSelectedClient(client);
    setShowDropdown(false);
    setSearch(client.companyName || client.user?.name || "");
  }, []);

  const handleClearClient = useCallback(() => {
    setSelectedClient(null);
    setSearch("");
  }, []);

  const toggleService = useCallback((serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  }, []);

  async function handleSubmit() {
    try {
      let clientId: string;

      if (mode === "new") {
        if (!newPhone) {
          toast.error("رقم الهاتف مطلوب");
          return;
        }
        if (!newPassword || newPassword.length < 8) {
          toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
          return;
        }

        const client = await createClient({
          phoneWhatsapp: newPhone,
          email: newEmail || undefined,
          password: newPassword,
        }).unwrap();
        clientId = client.id;
      } else {
        if (!selectedClient) {
          toast.error("اختر عميلاً أولاً");
          return;
        }
        clientId = selectedClient.id;
      }

      if (selectedServices.length === 0) {
        toast.error("اختر خدمة واحدة على الأقل");
        return;
      }

      const result = await createRequest({
        clientId,
        services: selectedServices.map((id) => ({ serviceId: id, quantity: 1 })),
        notes: description || undefined,
      }).unwrap();

      toast.success("تم إنشاء الطلب بنجاح!");
      router.push(`/dashboard/sales/requests/${result.id}`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "حدث خطأ. يرجى المحاولة مرة أخرى.");
    }
  }

  const canSubmit =
    selectedServices.length > 0 &&
    (mode === "existing" ? !!selectedClient : !!newPhone && !!newPassword && newPassword.length >= 8);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-500 text-natural-0 shrink-0">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">طلب جديد</h1>
          <p className="text-sm text-neutral-300">
            اختر عميلاً موجوداً أو أنشئ حساباً جديداً، ثم اختر الخدمات المطلوبة
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* ── Mode Toggle ─────────────────────────── */}
        <div className="flex rounded-lg border p-1 bg-neutral-50/50">
          {[
            { value: "existing" as ClientMode, label: "عميل موجود", icon: Users },
            { value: "new" as ClientMode, label: "عميل جديد", icon: UserPlus },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setSelectedClient(null);
                setSearch("");
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all",
                mode === value
                  ? "bg-white text-natural-100 shadow-sm"
                  : "text-neutral-300 hover:text-natural-100",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Existing Client Picker ──────────────── */}
        {mode === "existing" && (
          <div className="flex flex-col gap-4" ref={searchRef}>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                ابحث عن عميل <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                    if (selectedClient) setSelectedClient(null);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="ابحث باسم العميل أو الشركة..."
                  className={cn(
                    "w-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm outline-none transition-colors",
                    "placeholder:text-neutral-200 focus:border-secondary-500",
                    selectedClient ? "border-success-400 bg-success-50/30" : "border-neutral-50",
                  )}
                />
                {selectedClient && (
                  <button
                    type="button"
                    onClick={handleClearClient}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-danger-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showDropdown && !selectedClient && (
                <div
                  ref={dropdownRef}
                  className="mt-1 rounded-lg border bg-white shadow-sm max-h-48 overflow-y-auto"
                >
                  {search.length >= 2 && filteredClients.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-neutral-300">
                      <UserPlus className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p>لا توجد نتائج</p>
                      <button
                        type="button"
                        onClick={() => setMode("new")}
                        className="mt-2 text-secondary-500 hover:underline font-medium"
                      >
                        أنشئ عميلاً جديداً
                      </button>
                    </div>
                  ) : search.length < 2 ? (
                    <div className="px-4 py-3 text-sm text-neutral-300">
                      اكتب حرفين على الأقل للبحث
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full px-4 py-2.5 text-right text-sm hover:bg-neutral-50/60 transition-colors border-b border-neutral-50 last:border-0"
                      >
                        <span className="font-medium">{client.companyName || client.user?.name}</span>
                        {client.user?.name && (
                          <span className="text-neutral-300 mr-2">{client.user.name}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedClient && (
                <div className="mt-3 rounded-lg border border-success-200 bg-success-50/20 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />
                    <span className="text-sm font-medium">
                      {selectedClient.companyName || selectedClient.user?.name}
                    </span>
                  </div>
                  {selectedClient.user?.name && (
                    <p className="text-xs text-neutral-300 mr-6 mt-0.5">
                      {selectedClient.user.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── New Client Form ─────────────────────── */}
        {mode === "new" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-300">
              أنشئ حساباً مبدئياً للعميل. سيتمكن من إكمال بياناته لاحقاً عبر بوابة العميل.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                رقم الهاتف (واتساب) <span className="text-danger-500">*</span>
              </label>
              <input
                type="tel"
                dir="ltr"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+966 5X XXX XXXX"
                className="w-full rounded-lg border border-neutral-50 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-neutral-200 focus:border-secondary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                dir="ltr"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-lg border border-neutral-50 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-neutral-200 focus:border-secondary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                كلمة المرور <span className="text-danger-500">*</span>
              </label>
              <input
                type="password"
                dir="ltr"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                className="w-full rounded-lg border border-neutral-50 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-neutral-200 focus:border-secondary-500"
              />
              {newPassword && newPassword.length < 8 && (
                <p className="text-xs text-danger-500 mt-1">كلمة المرور يجب أن تكون 8 أحرف على الأقل</p>
              )}
            </div>
          </div>
        )}

        {/* ── Divider ─────────────────────────────── */}
        <div className="border-t" />

        {/* ── Services ────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium mb-3">
            الخدمات المطلوبة <span className="text-danger-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(activeServices.length > 0 ? activeServices : [
              { id: "social_media", nameAr: "إدارة وسائل التواصل الاجتماعي" },
              { id: "content", nameAr: "إنشاء المحتوى" },
              { id: "paid_ads", nameAr: "الإعلانات المدفوعة (Meta / Google)" },
              { id: "seo", nameAr: "تحسين محركات البحث (SEO)" },
              { id: "web_dev", nameAr: "تطوير المواقع الإلكترونية" },
              { id: "design", nameAr: "التصميم الجرافيكي" },
              { id: "branding", nameAr: "إدارة العلامة التجارية" },
              { id: "email_marketing", nameAr: "التسويق بالبريد الإلكتروني" },
            ]).map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-all text-right",
                  selectedServices.includes(service.id)
                    ? "border-secondary-500 bg-secondary-50/30"
                    : "border-neutral-50 hover:bg-neutral-50/40",
                )}
              >
                <Checkbox
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                  className="pointer-events-none"
                />
                <span className="text-sm">{service.nameAr || service.name}</span>
              </button>
            ))}
          </div>
          {selectedServices.length === 0 && (
            <p className="text-xs text-neutral-300 mt-2">اختر خدمة واحدة على الأقل</p>
          )}
        </div>

        {/* ── Notes ───────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            ملاحظات (اختياري)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="أخبرنا باختصار عن احتياج العميل..."
            className="w-full rounded-lg border border-neutral-50 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-neutral-200 focus:border-secondary-500 resize-none h-24"
          />
        </div>

        {/* ── Submit ──────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 border-t gap-3">
          <ActionButton
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            إلغاء
          </ActionButton>

          <ActionButton
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            {isSubmitting ? "جاري الإنشاء..." : "إنشاء الطلب"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}