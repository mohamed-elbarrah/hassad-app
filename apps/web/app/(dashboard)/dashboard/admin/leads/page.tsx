"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, UserCog, Download, Funnel, Table2 } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PageIntro } from "@/components/design-system/PageIntro";
import { StatCard } from "@/components/design-system/StatCard";
import { DataTable } from "@/components/design-system/DataTable";
import { Pill } from "@/components/design-system/Pill";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import {
  useGetAdminLeadsQuery,
  useReassignLeadMutation,
  type LeadRow,
} from "@/features/admin/adminApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { PIPELINE_STAGE_AR, PIPELINE_STAGE_ORDER } from "@hassad/shared";

const STAGE_OPTIONS = [
  { label: "الكل", value: "" },
  { label: "جديد", value: "NEW" },
  { label: "مؤهل", value: "QUALIFIED" },
  { label: "عرض", value: "PROPOSAL" },
  { label: "تفاوض", value: "NEGOTIATION" },
  { label: "مغلق", value: "CLOSED" },
];

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
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

export default function AdminLeadsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
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

  const { data, isLoading, isError } = useGetAdminLeadsQuery(filters);
  const [reassign] = useReassignLeadMutation();
  const { data: usersData } = useSearchUsersQuery({
    role: "SALES",
    limit: 20,
    search: userSearch || undefined,
  });

  const leads = data?.items ?? [];
  const salesUsers = usersData?.items ?? [];

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

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="العملاء المحتملون"
        description={`إجمالي ${data?.total ?? 0} عميل محتمل`}
        icon={TrendingUp}
        actions={
          <button
            onClick={() => exportCSV(leads, "العملاء-المحتملون")}
            className="inline-flex items-center gap-2 rounded-xl border border-portal-divider px-4 py-2 text-sm font-medium hover:bg-badge-gray-bg transition-colors"
          >
            <Download className="size-4" />
            تصدير CSV
          </button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي" value={data?.total ?? 0} icon={TrendingUp} />
        <StatCard title="جديد" value={leads.filter((l) => l.pipelineStage === "NEW").length} variant="warning" />
        <StatCard title="مؤهل" value={leads.filter((l) => l.pipelineStage === "QUALIFIED").length} variant="success" />
        <StatCard
          title="معدل التحويل"
          value={leads.length > 0 ? `${Math.round((leads.filter((l) => l.pipelineStage === "CLOSED").length / leads.length) * 100)}%` : "0%"}
          variant="default"
        />
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
          groups={[{ key: "stage", label: "المرحلة", options: STAGE_OPTIONS }]}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
        <div className="flex gap-1 rounded-xl border border-portal-divider p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "table"
                ? "bg-secondary-500 text-white"
                : "text-portal-note-text hover:text-natural-100"
            }`}
          >
            <Table2 className="size-4" />
            عرض جدول
          </button>
          <button
            onClick={() => setViewMode("pipeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "pipeline"
                ? "bg-secondary-500 text-white"
                : "text-portal-note-text hover:text-natural-100"
            }`}
          >
            <Funnel className="size-4" />
            عرض القمع
          </button>
        </div>
      </div>

      {viewMode === "pipeline" ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGE_ORDER.map((stage) => {
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
                      {PIPELINE_STAGE_AR[stage] ?? stage}
                    </h3>
                    <Pill tone="blue">{stageLeads.length}</Pill>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[600px]">
                    {stageLeads.length === 0 && (
                      <p className="text-center text-portal-note-text text-sm py-8">
                        لا توجد عملاء
                      </p>
                    )}
                    {stageLeads.map((l: LeadRow) => (
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
                        <div className="flex items-center justify-between text-xs text-portal-note-text">
                          <span>{l.assigneeName}</span>
                          <Pill tone="neutral">
                            {PIPELINE_STAGE_AR[l.pipelineStage] ?? l.pipelineStage}
                          </Pill>
                        </div>
                      </button>
                    ))}
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
          { id: "source", label: "المصدر" },
          { id: "attempts", label: "محاولات التواصل" },
          { id: "lastContact", label: "آخر تواصل", align: "left" },
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
                {PIPELINE_STAGE_AR[l.pipelineStage] ?? l.pipelineStage}
              </Pill>
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {l.source ?? "—"}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {l.contactAttemptCount}
            </td>
            <td
              className="px-5 py-4 text-sm text-portal-note-text text-left"
              dir="ltr"
            >
              {l.lastContactAt?.slice(0, 10) ?? "—"}
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
