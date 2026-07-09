"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, Archive, UserCog, Flag, Download, LayoutGrid, Table, Plus, Clock, CheckCircle2, PauseCircle, AlertTriangle, Users } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { Dialog } from "@/components/design-system/Dialog";
import { StatCard } from "@/components/design-system/StatCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { toast } from "sonner";
import {
  useGetAdminProjectsQuery,
  useCreateAdminProjectMutation,
  useReassignProjectPmMutation,
  useArchiveProjectMutation,
  useForceProjectStatusMutation,
  type ProjectRow,
} from "@/features/admin/adminApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { useGetAdminClientsQuery } from "@/features/admin/adminApi";
import { PROJECT_STATUS_AR, ProjectStatus } from "@hassad/shared";
import { cn } from "@/lib/utils";

type ScheduleStatus = "ON_TRACK" | "AT_RISK" | "DELAYED";

const SCHEDULE_STATUS_CONFIG: Record<ScheduleStatus, { label: string; headerClass: string; badgeClass: string }> = {
  ON_TRACK: { label: "ضمن الجدول", headerClass: "bg-green-50 text-green-700 border-green-200", badgeClass: "bg-green-100 text-green-800" },
  AT_RISK: { label: "متأخر قليلاً", headerClass: "bg-amber-50 text-amber-700 border-amber-200", badgeClass: "bg-amber-100 text-amber-800" },
  DELAYED: { label: "متأخر", headerClass: "bg-red-50 text-red-700 border-red-200", badgeClass: "bg-red-100 text-red-800" },
};

function getScheduleStatus(p: ProjectRow): ScheduleStatus {
  if (p.isBehindSchedule) return "DELAYED";
  if (p.overdueTasksCount > 0) return "AT_RISK";
  return "ON_TRACK";
}

const FILTER_STATUS_OPTIONS = [
  { label: "الكل", value: "" },
  ...Object.entries(PROJECT_STATUS_AR).map(([value, label]) => ({
    label,
    value,
  })),
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

export default function AdminProjectsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [actionProject, setActionProject] = useState<ProjectRow | null>(null);
  const [actionType, setActionType] = useState<
    "reassign" | "archive" | "status" | null
  >(null);
  const [statusValue, setStatusValue] = useState("");
  const [reason, setReason] = useState("");
  const [pmSearch, setPmSearch] = useState("");

  const debouncedSearch = useDebounce(searchInput, 400);
  const filters: any = {
    search: debouncedSearch || undefined,
    ...activeFilters,
  };
  if (filters.status?.[0]) filters.status = filters.status[0];
  if (filters.overdueOnly?.[0]) filters.overdueOnly = "true";

  const { data, isLoading, isError } = useGetAdminProjectsQuery(filters);
  const [reassignPm] = useReassignProjectPmMutation();
  const [archiveProject] = useArchiveProjectMutation();
  const [forceStatus] = useForceProjectStatusMutation();
  const { data: pmData } = useSearchUsersQuery({
    role: "PM",
    limit: 20,
    search: pmSearch || undefined,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    clientId: "",
    projectManagerId: "",
    status: "PLANNING",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [clientSearch, setClientSearch] = useState("");
  const { data: clientsData } = useGetAdminClientsQuery({
    search: clientSearch || undefined,
    limit: 20,
  });
  const [createProject] = useCreateAdminProjectMutation();
  const clients = clientsData?.items ?? [];

  const projects = data?.items ?? [];
  const pms = pmData?.items ?? [];

  const boardColumns = useMemo(() => {
    const groups: Record<ScheduleStatus, ProjectRow[]> = {
      ON_TRACK: [],
      AT_RISK: [],
      DELAYED: [],
    };
    for (const p of projects) {
      groups[getScheduleStatus(p)].push(p);
    }
    return groups;
  }, [projects]);

  const handleFilterChange = useCallback((key: string, values: string[]) => {
    setActiveFilters((prev) => ({ ...prev, [key]: values }));
  }, []);

  const filterGroups: FilterGroup[] = [
    { key: "status", label: "الحالة", options: FILTER_STATUS_OPTIONS },
    {
      key: "overdueOnly",
      label: "المتأخرة فقط",
      options: [{ label: "مهام متأخرة", value: "true" }],
    },
  ];

  const openAction = (
    project: ProjectRow,
    type: "reassign" | "archive" | "status",
  ) => {
    setActionProject(project);
    setActionType(type);
    setReason("");
    setStatusValue("");
  };

  const executeAction = async () => {
    if (!actionProject) return;
    try {
      if (actionType === "archive") {
        await archiveProject(actionProject.id).unwrap();
        toast.success("تم أرشفة المشروع");
      } else if (actionType === "reassign") {
        if (!statusValue) {
          toast.error("يرجى اختيار PM");
          return;
        }
        await reassignPm({
          id: actionProject.id,
          pmUserId: statusValue,
        }).unwrap();
        toast.success("تم إعادة تعيين PM");
      } else if (actionType === "status") {
        if (!statusValue || !reason) {
          toast.error("يرجى اختيار الحالة وكتابة السبب");
          return;
        }
        await forceStatus({
          id: actionProject.id,
          status: statusValue,
          reason,
        }).unwrap();
        toast.success("تم تغيير الحالة");
      }
      setActionProject(null);
      setActionType(null);
    } catch {
      toast.error("فشلت العملية");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="المشاريع"
        description={`إجمالي ${data?.total ?? 0} مشروع`}
        icon={Briefcase}
        actions={
          <div className="flex gap-2">
            <ActionButton size="md" onClick={() => setShowCreate(true)}>
              <Plus className="size-4 ml-1" />
              إنشاء مشروع جديد
            </ActionButton>
            <button
              onClick={() => exportCSV(projects, "المشاريع")}
              className="inline-flex items-center gap-2 rounded-xl border border-portal-divider px-4 py-2 text-sm font-medium hover:bg-badge-gray-bg transition-colors"
            >
              <Download className="size-4" />
              تصدير CSV
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="نشط" value={projects.filter((p) => p.status === "ACTIVE").length} icon={Briefcase} variant="success" />
        <StatCard title="مكتمل" value={projects.filter((p) => p.status === "COMPLETED").length} icon={CheckCircle2} variant="default" />
        <StatCard title="متأخر" value={projects.filter((p) => p.isBehindSchedule).length} icon={AlertTriangle} variant="danger" />
        <StatCard title="متوقف" value={projects.filter((p) => p.status === "ON_HOLD").length} icon={PauseCircle} variant="warning" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث عن مشروع..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex rounded-xl border border-portal-divider overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors",
                viewMode === "table"
                  ? "bg-secondary-50 text-secondary-600"
                  : "text-portal-note-text hover:text-natural-100",
              )}
            >
              <Table className="size-4" />
              جدول
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors",
                viewMode === "board"
                  ? "bg-secondary-50 text-secondary-600"
                  : "text-portal-note-text hover:text-natural-100",
              )}
            >
              <LayoutGrid className="size-4" />
              لوحة
            </button>
          </div>
          <FilterBar
            groups={filterGroups}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {viewMode === "table" ? (
        <DataTable
          columns={[
            { id: "name", label: "المشروع" },
            { id: "client", label: "العميل" },
            { id: "pm", label: "مدير المشروع" },
            { id: "status", label: "الحالة" },
            { id: "totalValue", label: "قيمة المشروع" },
            { id: "remainingValue", label: "المبلغ المتبقي" },
            { id: "completion", label: "الإنجاز" },
            { id: "overdueTasks", label: "المهام المتأخرة" },
            { id: "isOverdue", label: "متأخر" },
            { id: "dates", label: "تاريخ البداية" },
            { id: "actions", label: "الإجراءات", width: "160px" },
          ]}
          data={projects}
          isLoading={isLoading}
          isError={isError}
          emptyState={{
            icon: Briefcase,
            message: "لا توجد مشاريع",
            hint: "لم يتم إنشاء أي مشاريع بعد",
          }}
          renderRow={(p: ProjectRow) => (
            <tr
              key={p.id}
              className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
              onClick={() => router.push(`/dashboard/admin/projects/${p.id}`)}
            >
              <td className="px-5 py-4 text-base font-medium text-natural-100">
                {p.name}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {p.clientName}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {p.pmName}
              </td>
              <td className="px-5 py-4">
                <StatusBadge
                  status={p.status}
                  label={PROJECT_STATUS_AR[p.status] ?? p.status}
                />
              </td>
              <td className="px-5 py-4 text-sm font-medium text-natural-100" dir="ltr">
                {p.totalValue > 0 ? `${p.totalValue.toLocaleString()} ر.س` : "—"}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text" dir="ltr">
                {p.remainingValue > 0 ? `${p.remainingValue.toLocaleString()} ر.س` : "—"}
              </td>
              <td className="px-5 py-4">
                <Pill
                  tone={
                    p.completionPercentage >= 100
                      ? "success"
                      : p.completionPercentage >= 50
                        ? "warning"
                        : "neutral"
                  }
                >
                  {p.completionPercentage}%
                </Pill>
              </td>
              <td className="px-5 py-4">
                {p.overdueTasksCount > 0 ? (
                  <Pill tone="danger">{p.overdueTasksCount}</Pill>
                ) : (
                  <span className="text-sm text-portal-note-text">0</span>
                )}
              </td>
              <td className="px-5 py-4">
                <Pill tone={p.isBehindSchedule ? "danger" : "neutral"}>
                  {p.isBehindSchedule ? "نعم" : "لا"}
                </Pill>
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {p.startDate?.slice(0, 10) ?? "—"}
              </td>
              <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1">
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    title="إعادة تعيين PM"
                    onClick={() => openAction(p, "reassign")}
                  >
                    <UserCog className="size-3.5" />
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    title="تغيير الحالة"
                    onClick={() => openAction(p, "status")}
                  >
                    <Flag className="size-3.5" />
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    title="أرشفة"
                    onClick={() => openAction(p, "archive")}
                  >
                    <Archive className="size-3.5" />
                  </ActionButton>
                </div>
              </td>
            </tr>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(SCHEDULE_STATUS_CONFIG) as [ScheduleStatus, typeof SCHEDULE_STATUS_CONFIG[ScheduleStatus]][]).map(
            ([status, config]) => (
              <div key={status} className="rounded-2xl border border-portal-divider overflow-hidden">
                <div className={cn("px-4 py-3 border-b flex items-center justify-between", config.headerClass)}>
                  <span className="font-semibold text-sm">{config.label}</span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.badgeClass)}>
                    {boardColumns[status].length}
                  </span>
                </div>
                <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
                  {boardColumns[status].length === 0 && (
                    <EmptyState icon={Briefcase} title="لا توجد مشاريع" />
                  )}
                  {boardColumns[status].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/dashboard/admin/projects/${p.id}`)}
                      className="rounded-xl border border-portal-divider p-4 cursor-pointer hover:bg-badge-gray-bg/50 transition-colors space-y-2"
                    >
                      <p className="font-medium text-natural-100 text-sm leading-tight">{p.name}</p>
                      <p className="text-xs text-portal-note-text">{p.clientName}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-portal-note-text">{p.endDate?.slice(0, 10) ?? "—"}</span>
                        <span className="text-xs font-medium">{p.remainingValue?.toLocaleString() ?? "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <Dialog
        open={!!actionProject}
        onOpenChange={(o) => {
          if (!o) {
            setActionProject(null);
            setActionType(null);
          }
        }}
        title={
          actionType === "reassign"
            ? "إعادة تعيين PM"
            : actionType === "archive"
              ? "أرشفة المشروع"
              : "تغيير الحالة"
        }
        description={
          actionType === "archive"
            ? "هل أنت متأكد من أرشفة هذا المشروع؟"
            : undefined
        }
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => {
                setActionProject(null);
                setActionType(null);
              }}
            >
              إلغاء
            </ActionButton>
            <ActionButton onClick={executeAction}>تأكيد</ActionButton>
          </div>
        }
      >
        {actionType === "reassign" && (
          <div className="space-y-4">
            <FormInputControl
              placeholder="ابحث عن PM..."
              value={pmSearch}
              onChange={(e) => setPmSearch(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {pms.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => setStatusValue(u.id)}
                  className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-colors ${statusValue === u.id ? "bg-secondary-50 text-secondary-600" : "hover:bg-badge-gray-bg"}`}
                >
                  {u.name} — {u.email}
                </button>
              ))}
            </div>
          </div>
        )}
        {actionType === "status" && (
          <div className="space-y-4">
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
            >
              <option value="">اختر الحالة...</option>
              {Object.entries(PROJECT_STATUS_AR).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FormInputControl
              placeholder="سبب تغيير الحالة..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
      </Dialog>

      <Dialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="إنشاء مشروع جديد"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton variant="outline" onClick={() => setShowCreate(false)}>
              إلغاء
            </ActionButton>
            <ActionButton
              onClick={async () => {
                if (!createForm.name || !createForm.clientId || !createForm.startDate || !createForm.endDate) {
                  toast.error("يرجى ملء الحقول المطلوبة");
                  return;
                }
                try {
                  await createProject(createForm).unwrap();
                  toast.success("تم إنشاء المشروع");
                  setShowCreate(false);
                  setCreateForm({ name: "", clientId: "", projectManagerId: "", status: "PLANNING", startDate: "", endDate: "", description: "" });
                } catch {
                  toast.error("فشل إنشاء المشروع");
                }
              }}
            >
              إنشاء
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-500 mb-1">اسم المشروع *</label>
            <FormInputControl
              placeholder="اسم المشروع"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-500 mb-1">العميل *</label>
            <FormInputControl
              placeholder="ابحث عن عميل..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
            <div className="max-h-32 overflow-y-auto mt-1 space-y-1">
              {clients.map((c: any) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCreateForm((f) => ({ ...f, clientId: c.id }));
                    setClientSearch(c.companyName ?? c.name ?? "");
                  }}
                  className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-colors ${createForm.clientId === c.id ? "bg-secondary-50 text-secondary-600" : "hover:bg-badge-gray-bg"}`}
                >
                  {c.companyName ?? c.name ?? "—"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-500 mb-1">مدير المشروع</label>
            <FormInputControl
              placeholder="ابحث عن PM..."
              value={pmSearch}
              onChange={(e) => setPmSearch(e.target.value)}
            />
            <div className="max-h-32 overflow-y-auto mt-1 space-y-1">
              {pms.map((u: any) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setCreateForm((f) => ({ ...f, projectManagerId: u.id }))}
                  className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-colors ${createForm.projectManagerId === u.id ? "bg-secondary-50 text-secondary-600" : "hover:bg-badge-gray-bg"}`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-500 mb-1">الحالة</label>
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
            >
              {Object.entries(PROJECT_STATUS_AR).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-500 mb-1">تاريخ البداية *</label>
              <FormInputControl
                type="date"
                value={createForm.startDate}
                onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500 mb-1">تاريخ النهاية *</label>
              <FormInputControl
                type="date"
                value={createForm.endDate}
                onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
