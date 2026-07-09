"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Building2, Eye, Globe, GlobeOff,
  TrendingUp, UserCog, Download, Funnel, Table2, CircleDollarSign, Clock,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { StatCard } from "@/components/design-system/StatCard";
import { DataTable } from "@/components/design-system/DataTable";
import { FilterPills } from "@/components/design-system/FilterPills";
import { FilterBar } from "@/components/design-system/FilterBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { Dialog } from "@/components/design-system/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/design-system/Tabs";
import {
  useGetAdminClientsQuery,
  useGetAdminClientsStatsQuery,
  useTogglePortalAccessMutation,
  useGetAdminLeadsQuery,
  useGetAdminLeadStatsQuery,
  useReassignLeadMutation,
  type LeadRow,
} from "@/features/admin/adminApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { formatDate, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CLIENT_STATUS_AR, LEAD_STAGE_AR, LEAD_STAGE_ORDER } from "@hassad/shared";
import { toast } from "sonner";

const CLIENT_STATUS_FILTERS = [
  { label: "الكل", value: "all" },
  { label: "نشط", value: "active" },
  { label: "متوقف", value: "stopped" },
];

const LEAD_NO_CONTACT_OPTIONS = [
  { label: "الكل", value: "" },
  { label: "7 أيام", value: "7" },
  { label: "30 يوماً", value: "30" },
  { label: "60 يوماً", value: "60" },
];

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  return `منذ ${Math.floor(days / 30)} أشهر`;
}

const exportCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(",")),
  ].join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

function ClientsTab() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetAdminClientsQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = useGetAdminClientsStatsQuery();
  const [togglePortal] = useTogglePortalAccessMutation();

  const clients = data?.items ?? [];

  const handleTogglePortal = async (clientId: string) => {
    try {
      const result = await togglePortal(clientId).unwrap();
      toast.success(result.enabled ? "تم تفعيل البوابة" : "تم تعطيل البوابة");
    } catch {
      toast.error("فشل تحديث حالة البوابة");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي العملاء" value={stats?.total ?? 0} icon={Building2} />
        <StatCard title="نشط" value={stats?.active ?? 0} icon={Building2} variant="success" />
        <StatCard title="متوقف" value={stats?.inactive ?? 0} icon={Building2} variant="warning" />
        <StatCard title="جديد هذا الشهر" value={stats?.newThisMonth ?? 0} icon={Building2} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث بالاسم أو الإيميل أو الشركة..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pr-9"
          />
        </div>
        <FilterPills
          options={CLIENT_STATUS_FILTERS}
          active={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
      </div>

      <DataTable
        columns={[
          { id: "name", label: "الاسم" },
          { id: "company", label: "الشركة" },
          { id: "contracts", label: "العقود" },
          { id: "projects", label: "المشاريع" },
          { id: "overdue", label: "فواتير متأخرة" },
          { id: "revenue", label: "الإيرادات" },
          { id: "portal", label: "البوابة" },
          { id: "status", label: "الحالة" },
          { id: "createdAt", label: "تاريخ الإنشاء", align: "left" },
          { id: "actions", label: "", align: "left" },
        ]}
        data={clients}
        isLoading={isLoading}
        isError={isError}
        emptyState={{
          icon: Building2,
          message: "لا يوجد عملاء",
          hint: "لا توجد نتائج مطابقة للبحث",
        }}
        renderRow={(c: any) => {
          const statusLabel = c.status
            ? (CLIENT_STATUS_AR as Record<string, string>)[c.status] ?? c.status
            : (c.isActive ? "نشط" : "معطل");
          return (
            <tr
              key={c.id}
              className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
              onClick={() => router.push(`/dashboard/admin/clients/${c.id}`)}
            >
              <td className="px-5 py-4 text-sm font-medium">{c.name}</td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {c.companyName}
              </td>
              <td className="px-5 py-4 text-sm">{c.contractsCount}</td>
              <td className="px-5 py-4 text-sm">{c.projectsCount}</td>
              <td className="px-5 py-4">
                <Pill tone={c.overdueInvoicesCount > 0 ? "danger" : "neutral"}>
                  {c.overdueInvoicesCount ?? 0}
                </Pill>
              </td>
              <td className="px-5 py-4 text-sm font-medium">
                {formatCurrency(c.totalRevenue)}
              </td>
              <td className="px-5 py-4">
                <div onClick={(e) => e.stopPropagation()}>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleTogglePortal(c.id)}
                    className={c.portalAccess ? "text-success-600" : "text-portal-icon"}
                  >
                    {c.portalAccess ? <Globe className="size-4" /> : <GlobeOff className="size-4" />}
                  </ActionButton>
                </div>
              </td>
              <td className="px-5 py-4">
                <StatusBadge
                  status={c.isActive ? "ACTIVE" : "STOPPED"}
                  label={statusLabel}
                />
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text text-left">
                {formatDate(c.createdAt)}
              </td>
              <td className="px-5 py-4 text-left">
                <ActionButton variant="ghost" size="sm">
                  <Eye className="size-4" />
                </ActionButton>
              </td>
            </tr>
          );
        }}
      />

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-portal-divider">
          <span className="text-sm text-portal-note-text">
            إجمالي {data.total} عميل
          </span>
          <div className="flex gap-2">
            <ActionButton
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </ActionButton>
            <ActionButton
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadsTab() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");
  const [actionLead, setActionLead] = useState<LeadRow | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const debouncedSearch = useDebounce(searchInput, 400);
  const filters: any = {
    search: debouncedSearch || undefined,
    ...activeFilters,
  };
  if (filters.stage?.[0]) filters.stage = filters.stage[0];
  if (filters.noContactSince?.[0]) filters.noContactSince = filters.noContactSince[0];

  const { data, isLoading, isError } = useGetAdminLeadsQuery(filters);
  const { data: statsData } = useGetAdminLeadStatsQuery();
  const [reassign] = useReassignLeadMutation();
  const { data: usersData } = useSearchUsersQuery({
    role: "SALES",
    limit: 20,
    search: userSearch || undefined,
  });

  const leads = data?.items ?? [];
  const salesUsers = usersData?.items ?? [];
  const totalLeads = statsData?.byStage?.reduce((a: number, b: any) => a + b.count, 0) ?? 0;
  const newLeads = leads.filter((l) => l.pipelineStage === "NEW").length;
  const qualifiedLeads = leads.filter((l) => l.pipelineStage === "QUALIFIED").length;
  const closedLeads = leads.filter((l) => l.pipelineStage === "WON" || l.pipelineStage === "LOST").length;
  const conversionRate = statsData?.conversionRate ?? 0;

  const handleFilterChange = useCallback(
    (key: string, values: string[]) =>
      setActiveFilters((prev) => ({ ...prev, [key]: values })),
    [],
  );

  const handleReassign = async () => {
    if (!actionLead || !selectedUserId) {
      toast.error("يرجى اختيار موظف");
      return;
    }
    try {
      await reassign({
        id: actionLead.id,
        assigneeId: selectedUserId,
      }).unwrap();
      toast.success("تم إعادة التعيين");
      setActionLead(null);
      setSelectedUserId("");
    } catch {
      toast.error("فشلت العملية");
    }
  };

  const stageFilterOptions = [
    { label: "الكل", value: "" },
    ...LEAD_STAGE_ORDER.map((s) => ({ label: LEAD_STAGE_AR[s] ?? s, value: s })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي" value={totalLeads} icon={TrendingUp} />
        <StatCard title="جديد" value={newLeads} variant="warning" />
        <StatCard title="مؤهل" value={qualifiedLeads} variant="success" />
        <StatCard title="محوّل/مغلق" value={closedLeads} variant="default" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="معدل التحويل" value={`${conversionRate}%`} icon={CircleDollarSign} variant="default" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث بالاسم أو الشركة..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <FilterBar
          groups={[
            { key: "stage", label: "المرحلة", options: stageFilterOptions },
            { key: "noContactSince", label: "بلا تواصل منذ", options: LEAD_NO_CONTACT_OPTIONS },
          ]}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
        <div className="flex gap-1 rounded-xl border border-portal-divider p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              viewMode === "table"
                ? "bg-secondary-500 text-white"
                : "text-portal-note-text hover:text-natural-100",
            )}
          >
            <Table2 className="size-4" />
            جدول
          </button>
          <button
            onClick={() => setViewMode("pipeline")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              viewMode === "pipeline"
                ? "bg-secondary-500 text-white"
                : "text-portal-note-text hover:text-natural-100",
            )}
          >
            <Funnel className="size-4" />
            قمع مبيعات
          </button>
        </div>
        <button
          onClick={() => exportCSV(leads, "العملاء-المحتملون")}
          className="inline-flex items-center gap-2 rounded-xl border border-portal-divider px-4 py-1.5 text-sm font-medium hover:bg-badge-gray-bg transition-colors"
        >
          <Download className="size-4" />
          تصدير CSV
        </button>
      </div>

      {viewMode === "pipeline" ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {LEAD_STAGE_ORDER.map((stage) => {
              const stageLeads = leads.filter(
                (l: LeadRow) => l.pipelineStage === stage,
              );
              return (
                <div
                  key={stage}
                  className="flex flex-col w-72 rounded-2xl border border-portal-divider bg-portal-bg overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-portal-divider">
                    <h3 className="text-sm font-semibold text-natural-100">
                      {LEAD_STAGE_AR[stage] ?? stage}
                    </h3>
                    <Pill tone="blue">{stageLeads.length}</Pill>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[600px]">
                    {stageLeads.length === 0 && (
                      <p className="text-center text-portal-note-text text-sm py-8">
                        لا توجد عملاء
                      </p>
                    )}
                    {stageLeads.map((l: LeadRow) => {
                      const daysInStage = l.createdAt
                        ? Math.floor(
                            (Date.now() - new Date(l.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24),
                          )
                        : null;
                      return (
                        <button
                          key={l.id}
                          onClick={() => router.push(`/dashboard/admin/leads/${l.id}`)}
                          className="w-full text-right bg-white rounded-xl border border-portal-divider p-3 hover:shadow-md transition-shadow space-y-2"
                        >
                          <p className="text-sm font-medium text-natural-100">
                            {l.companyName}
                          </p>
                          <p className="text-xs text-portal-note-text">
                            {l.contactName}
                          </p>
                          {l.potentialValue != null && (
                            <p className="text-xs font-semibold text-secondary-600">
                              {formatCurrency(l.potentialValue)}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-portal-note-text">
                            <span>{l.assigneeName}</span>
                            {daysInStage != null && (
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {daysInStage} يوم
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <DataTable
          columns={[
            { id: "company", label: "الشركة" },
            { id: "contact", label: "جهة الاتصال" },
            { id: "assignee", label: "المسؤول" },
            { id: "stage", label: "المرحلة" },
            { id: "potentialValue", label: "القيمة المحتملة" },
            { id: "source", label: "المصدر" },
            { id: "attempts", label: "محاولات التواصل" },
            { id: "lastContact", label: "آخر تواصل", align: "left" },
            { id: "daysSince", label: "أيام منذ آخر تواصل", align: "left" },
            { id: "actions", label: "الإجراءات", width: "60px" },
          ]}
          data={leads}
          isLoading={isLoading}
          isError={isError}
          emptyState={{
            icon: TrendingUp,
            message: "لا توجد عملاء محتملين",
            hint: "لم يتم إضافة أي عملاء محتملين بعد",
          }}
          renderRow={(l: LeadRow) => (
            <tr
              key={l.id}
              className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
              onClick={() => router.push(`/dashboard/admin/leads/${l.id}`)}
            >
              <td className="px-5 py-4 text-base font-medium text-natural-100">
                {l.companyName}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {l.contactName}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {l.assigneeName}
              </td>
              <td className="px-5 py-4">
                <Pill tone="blue">
                  {LEAD_STAGE_AR[l.pipelineStage] ?? l.pipelineStage}
                </Pill>
              </td>
              <td className="px-5 py-4 text-sm font-medium text-secondary-600">
                {formatCurrency(l.potentialValue)}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {l.source ?? "—"}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {l.contactAttemptCount}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text text-left" dir="ltr">
                {relativeTime(l.lastContactAt)}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text text-left">
                {l.daysSinceLastContact != null
                  ? `${l.daysSinceLastContact} يوم`
                  : "—"}
              </td>
              <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  title="إعادة تعيين"
                  onClick={() => {
                    setActionLead(l);
                    setSelectedUserId("");
                  }}
                >
                  <UserCog className="size-3.5" />
                </ActionButton>
              </td>
            </tr>
          )}
        />
      )}

      <Dialog
        open={!!actionLead}
        onOpenChange={(o) => {
          if (!o) setActionLead(null);
        }}
        title="إعادة تعيين العميل المحتمل"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton variant="outline" onClick={() => setActionLead(null)}>
              إلغاء
            </ActionButton>
            <ActionButton onClick={handleReassign}>تأكيد</ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <FormInputControl
            placeholder="ابحث عن موظف مبيعات..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {salesUsers.map((u: any) => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-colors ${selectedUserId === u.id ? "bg-secondary-50 text-secondary-600" : "hover:bg-badge-gray-bg"}`}
              >
                {u.name} — {u.email}
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function AdminClientsPage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إدارة العملاء"
        description="إدارة العملاء الحاليين والعملاء المحتملين"
        icon={Building2}
      />

      <Tabs defaultValue="clients" dir="rtl">
        <TabsList>
          <TabsTrigger value="clients">العملاء الحاليون</TabsTrigger>
          <TabsTrigger value="leads">العملاء المحتملون</TabsTrigger>
        </TabsList>
        <TabsContent value="clients">
          <ClientsTab />
        </TabsContent>
        <TabsContent value="leads">
          <LeadsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
