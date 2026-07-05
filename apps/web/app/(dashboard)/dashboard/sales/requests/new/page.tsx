"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInput } from "@/components/design-system/FormInput";
import { FormTextarea } from "@/components/design-system/FormTextarea";
import { Checkbox } from "@/components/design-system/Checkbox";
import { Input } from "@/components/design-system/Input";
import { Tabs, TabsList, TabsTrigger } from "@/components/design-system/Tabs";
import { SalesPageHeader } from "@/components/dashboard/sales/shared/SalesPageHeader";
import { useCreateRequestForClientMutation } from "@/features/requests/requestsApi";
import {
  useCreateClientMutation,
  useGetClientsQuery,
} from "@/features/clients/clientsApi";
import { useGetServicesQuery } from "@/features/services/servicesApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Debounce hook (matches admin pattern) ────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type ClientMode = "existing" | "new";

export default function NewOrderPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ClientMode>("existing");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    companyName: string;
    user?: { name: string } | null;
  } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const [createClient, { isLoading: isCreatingClient }] =
    useCreateClientMutation();
  const [createRequest, { isLoading: isCreatingRequest }] =
    useCreateRequestForClientMutation();
  const { data: services } = useGetServicesQuery(undefined);
  const { data: clientsData } = useGetClientsQuery(
    debouncedSearch.length >= 1
      ? { search: debouncedSearch, limit: 10 }
      : { limit: 10 },
    { skip: mode !== "existing" },
  );

  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeServices = (services ?? []).filter((s) => s.isActive);
  const isSubmitting = isCreatingClient || isCreatingRequest;

  const filteredClients = useMemo(() => {
    if (!clientsData?.items) return [];
    if (!debouncedSearch) return clientsData.items;
    const q = debouncedSearch.toLowerCase();
    return clientsData.items.filter((client) => {
      const name = (
        client.companyName ||
        client.user?.name ||
        ""
      ).toLowerCase();
      return name.includes(q);
    });
  }, [clientsData, debouncedSearch]);

  const handleSelectClient = useCallback(
    (client: {
      id: string;
      companyName: string;
      user?: { name: string } | null;
    }) => {
      setSelectedClient(client);
      setShowDropdown(false);
      setSearchInput(client.companyName || client.user?.name || "");
    },
    [],
  );

  const handleClearClient = useCallback(() => {
    setSelectedClient(null);
    setSearchInput("");
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
        services: selectedServices.map((id) => ({
          serviceId: id,
          quantity: 1,
        })),
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
    (mode === "existing"
      ? !!selectedClient
      : !!newPhone && !!newPassword && newPassword.length >= 8);

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <SalesPageHeader
        title="طلب جديد"
        description="اختر عميلاً موجوداً أو أنشئ حساباً جديداً، ثم اختر الخدمات المطلوبة"
        icon={Users}
      />

      <div className="flex flex-col gap-5 mt-5">
        {/* ── Mode Toggle (using Tabs from design system) ──────────── */}
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as ClientMode);
            setSelectedClient(null);
            setSearchInput("");
          }}
          dir="rtl"
        >
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1 gap-2">
              <Users className="w-4 h-4" />
              عميل موجود
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1 gap-2">
              <UserPlus className="w-4 h-4" />
              عميل جديد
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ── Existing Client Picker ──────────────────────────────── */}
        {mode === "existing" && (
          <div className="flex flex-col gap-4" ref={searchRef}>
            <div>
              <label className="block text-sm font-medium text-natural-100 mb-1.5">
                ابحث عن عميل <span className="text-danger-600">*</span>
              </label>
              <div className="relative">
                <Input
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowDropdown(true);
                    if (selectedClient) setSelectedClient(null);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="ابحث باسم العميل أو الشركة..."
                  icon={<Search className="w-4 h-4" />}
                  className={cn(selectedClient && "border-success-400")}
                />
                {selectedClient && (
                  <button
                    type="button"
                    onClick={handleClearClient}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-note-text hover:text-danger-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showDropdown && !selectedClient && (
                <div
                  ref={dropdownRef}
                  className="mt-1 rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 shadow-lg max-h-48 overflow-y-auto"
                >
                  {debouncedSearch.length >= 1 &&
                  filteredClients.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-portal-note-text">
                      <UserPlus className="w-6 h-6 mx-auto mb-2 text-portal-note-text" />
                      <p>لا توجد نتائج</p>
                      <button
                        type="button"
                        onClick={() => setMode("new")}
                        className="mt-2 text-secondary-500 hover:underline font-medium"
                      >
                        أنشئ عميلاً جديداً
                      </button>
                    </div>
                  ) : debouncedSearch.length < 1 ? (
                    <div className="px-4 py-3 text-sm text-portal-note-text">
                      اكتب حرفاً واحداً على الأقل للبحث
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full px-4 py-2.5 text-right text-sm hover:bg-portal-bg transition-colors border-b border-portal-divider last:border-0"
                      >
                        <span className="font-medium text-natural-100">
                          {client.companyName || client.user?.name}
                        </span>
                        {client.user?.name && (
                          <span className="text-portal-note-text mr-2">
                            {client.user.name}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedClient && (
                <div className="mt-3 rounded-xl border-[1.5px] border-success-200 bg-success-100/30 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />
                    <span className="text-sm font-medium text-natural-100">
                      {selectedClient.companyName || selectedClient.user?.name}
                    </span>
                  </div>
                  {selectedClient.user?.name && (
                    <p className="text-xs text-portal-note-text mr-6 mt-0.5">
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
            <p className="text-sm text-portal-note-text">
              أنشئ حساباً مبدئياً للعميل. سيتمكن من إكمال بياناته لاحقاً عبر
              بوابة العميل.
            </p>
            <FormInput
              label="رقم الهاتف (واتساب)"
              required
              type="tel"
              dir="ltr"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+966 5X XXX XXXX"
            />
            <FormInput
              label="البريد الإلكتروني"
              type="email"
              dir="ltr"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="example@email.com"
            />
            <FormInput
              label="كلمة المرور"
              required
              type="password"
              dir="ltr"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8 أحرف على الأقل"
              error={
                newPassword && newPassword.length < 8
                  ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
                  : undefined
              }
            />
          </div>
        )}

        {/* ── Divider ─────────────────────────────── */}
        <div className="border-t border-portal-divider" />

        {/* ── Services ────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-natural-100 mb-3">
            الخدمات المطلوبة <span className="text-danger-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(activeServices.length > 0
              ? activeServices
              : [
                  {
                    id: "social_media",
                    nameAr: "إدارة وسائل التواصل الاجتماعي",
                  },
                  { id: "content", nameAr: "إنشاء المحتوى" },
                  {
                    id: "paid_ads",
                    nameAr: "الإعلانات المدفوعة (Meta / Google)",
                  },
                  { id: "seo", nameAr: "تحسين محركات البحث (SEO)" },
                  { id: "web_dev", nameAr: "تطوير المواقع الإلكترونية" },
                  { id: "design", nameAr: "التصميم الجرافيكي" },
                  { id: "branding", nameAr: "إدارة العلامة التجارية" },
                  {
                    id: "email_marketing",
                    nameAr: "التسويق بالبريد الإلكتروني",
                  },
                ]
            ).map((service) => (
              <label
                key={service.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-[1.5px] p-3 transition-all text-right cursor-pointer",
                  selectedServices.includes(service.id)
                    ? "border-secondary-500 bg-secondary-50/30"
                    : "border-portal-card-border hover:bg-portal-bg",
                )}
              >
                <Checkbox
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                />
                <span className="text-sm text-natural-100 select-none">
                  {service.nameAr || service.name}
                </span>
              </label>
            ))}
          </div>
          {selectedServices.length === 0 && (
            <p className="text-xs text-portal-note-text mt-2">
              اختر خدمة واحدة على الأقل
            </p>
          )}
        </div>

        {/* ── Notes ───────────────────────────────── */}
        <FormTextarea
          label="ملاحظات (اختياري)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="أخبرنا باختصار عن احتياج العميل..."
          rows={4}
        />

        {/* ── Submit ──────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 border-t border-portal-divider gap-3">
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
