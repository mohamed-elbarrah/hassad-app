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
import { SalesPageHeader } from "@/components/dashboard/sales/shared/SalesPageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                ابحث عن عميل <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowDropdown(true);
                    if (selectedClient) setSelectedClient(null);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="ابحث باسم العميل أو الشركة..."
                  className={cn("pr-10", selectedClient && "border-success")}
                />
                {selectedClient && (
                  <button
                    type="button"
                    onClick={handleClearClient}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showDropdown && !selectedClient && (
                <div
                  ref={dropdownRef}
                  className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-lg"
                >
                  {debouncedSearch.length >= 1 &&
                  filteredClients.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      <UserPlus className="mx-auto mb-2 size-6 text-muted-foreground" />
                      <p>لا توجد نتائج</p>
                      <button
                        type="button"
                        onClick={() => setMode("new")}
                        className="mt-2 font-medium text-primary hover:underline"
                      >
                        أنشئ عميلاً جديداً
                      </button>
                    </div>
                  ) : debouncedSearch.length < 1 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      اكتب حرفاً واحداً على الأقل للبحث
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full border-b border-border px-4 py-2.5 text-right text-sm transition-colors hover:bg-muted last:border-0"
                      >
                        <span className="font-medium text-foreground">
                          {client.companyName || client.user?.name}
                        </span>
                        {client.user?.name && (
                          <span className="mr-2 text-muted-foreground">
                            {client.user.name}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedClient && (
                <div className="mt-3 rounded-xl border border-success/30 bg-success/10 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                    <span className="text-sm font-medium text-foreground">
                      {selectedClient.companyName || selectedClient.user?.name}
                    </span>
                  </div>
                  {selectedClient.user?.name && (
                    <p className="mr-6 mt-0.5 text-xs text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">
              أنشئ حساباً مبدئياً للعميل. سيتمكن من إكمال بياناته لاحقاً عبر
              بوابة العميل.
            </p>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                رقم الهاتف (واتساب) <span className="text-destructive">*</span>
              </label>
              <Input
                type="tel"
                dir="ltr"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+966 5X XXX XXXX"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                dir="ltr"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="example@email.com"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                كلمة المرور <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                dir="ltr"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                className="h-11 rounded-xl"
              />
              {newPassword && newPassword.length < 8 ? (
                <p className="text-xs text-destructive">
                  كلمة المرور يجب أن تكون 8 أحرف على الأقل
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* ── Divider ─────────────────────────────── */}
        <div className="border-t border-border" />

        {/* ── Services ────────────────────────────── */}
        <div>
          <label className="mb-3 block text-sm font-medium text-foreground">
            الخدمات المطلوبة <span className="text-destructive">*</span>
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
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-right transition-all",
                  selectedServices.includes(service.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted",
                )}
              >
                <Checkbox
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                />
                <span className="select-none text-sm text-foreground">
                  {service.nameAr || service.name}
                </span>
              </label>
            ))}
          </div>
          {selectedServices.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              اختر خدمة واحدة على الأقل
            </p>
          )}
        </div>

        {/* ── Notes ───────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            ملاحظات (اختياري)
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="أخبرنا باختصار عن احتياج العميل..."
            rows={4}
            className="rounded-xl"
          />
        </div>

        {/* ── Submit ──────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? "جاري الإنشاء..." : "إنشاء الطلب"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
