"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ListChecks, UserCog, Flag, Download, Columns3, Table2 } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PageIntro } from "@/components/design-system/PageIntro";
import { StatCard } from "@/components/design-system/StatCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import {
  useGetAdminTasksQuery,
  useReassignTaskMutation,
  useForceTaskTransitionMutation,
  type TaskRow,
} from "@/features/admin/adminApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { TASK_STATUS_AR } from "@hassad/shared";

const KANBAN_COLUMNS = [
  { status: "TODO", label: "قيد الانتظار" },
  { status: "IN_PROGRESS", label: "قيد التنفيذ" },
  { status: "IN_REVIEW", label: "قيد المراجعة" },
  { status: "DONE", label: "مكتمل" },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-danger-500",
  MEDIUM: "bg-warning-500",
  LOW: "bg-neutral-300",
};

const STATUS_OPTIONS = [
  { label: "الكل", value: "" },
  { label: "قيد الانتظار", value: "TODO" },
  { label: "قيد التنفيذ", value: "IN_PROGRESS" },
  { label: "قيد المراجعة", value: "IN_REVIEW" },
  { label: "مكتمل", value: "DONE" },
  { label: "مراجعة", value: "REVISION" },
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

export default function AdminTasksPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [actionTask, setActionTask] = useState<TaskRow | null>(null);
  const [actionType, setActionType] = useState<"reassign" | "status" | null>(
    null,
  );
  const [statusValue, setStatusValue] = useState("");
  const [reason, setReason] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const debouncedSearch = useDebounce(searchInput, 400);
  const filters: any = {
    search: debouncedSearch || undefined,
    ...activeFilters,
  };
  if (filters.status?.[0]) filters.status = filters.status[0];
  if (filters.overdueOnly?.[0]) filters.overdueOnly = "true";

  const { data, isLoading, isError } = useGetAdminTasksQuery(filters);
  const [reassign] = useReassignTaskMutation();
  const [forceTransition] = useForceTaskTransitionMutation();
  const { data: usersData } = useSearchUsersQuery({
    excludeRole: "CLIENT",
    limit: 20,
    search: userSearch || undefined,
  });

  const tasks = data?.items ?? [];
  const users = usersData?.items ?? [];

  const handleFilterChange = useCallback(
    (key: string, values: string[]) =>
      setActiveFilters((prev) => ({ ...prev, [key]: values })),
    [],
  );

  const filterGroups: FilterGroup[] = [
    { key: "status", label: "الحالة", options: STATUS_OPTIONS },
    {
      key: "overdueOnly",
      label: "المتأخرة فقط",
      options: [{ label: "مهام متأخرة", value: "true" }],
    },
  ];

  const executeAction = async () => {
    if (!actionTask) return;
    try {
      if (actionType === "reassign") {
        if (!statusValue) {
          toast.error("يرجى اختيار موظف");
          return;
        }
        await reassign({ id: actionTask.id, assigneeId: statusValue }).unwrap();
        toast.success("تم إعادة تعيين المهمة");
      } else if (actionType === "status") {
        if (!statusValue || !reason) {
          toast.error("يرجى اختيار الحالة وكتابة السبب");
          return;
        }
        await forceTransition({
          id: actionTask.id,
          status: statusValue,
          reason,
        }).unwrap();
        toast.success("تم تغيير الحالة");
      }
      setActionTask(null);
      setActionType(null);
    } catch {
      toast.error("فشلت العملية");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="المهام"
        description={`إجمالي ${data?.total ?? 0} مهمة`}
        icon={ListChecks}
        actions={
          <button
            onClick={() => exportCSV(tasks, "المهام")}
            className="inline-flex items-center gap-2 rounded-xl border border-portal-divider px-4 py-2 text-sm font-medium hover:bg-badge-gray-bg transition-colors"
          >
            <Download className="size-4" />
            تصدير CSV
          </button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المهام" value={data?.total ?? 0} icon={ListChecks} />
        <StatCard title="مكتملة" value={tasks.filter((t) => t.status === "DONE").length} variant="success" />
        <StatCard title="متأخرة" value={tasks.filter((t) => t.isOverdue).length} variant="danger" />
        <StatCard title="بدون مسند" value={tasks.filter((t) => !t.assigneeName).length} variant="warning" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث عن مهمة..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <FilterBar
          groups={filterGroups}
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
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "kanban"
                ? "bg-secondary-500 text-white"
                : "text-portal-note-text hover:text-natural-100"
            }`}
          >
            <Columns3 className="size-4" />
            عرض كانبان
          </button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-0">
          {KANBAN_COLUMNS.map((col) => {
            const columnTasks = tasks.filter(
              (t: TaskRow) => t.status === col.status,
            );
            return (
              <div
                key={col.status}
                className="flex flex-col rounded-2xl border border-portal-divider bg-portal-bg overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-portal-divider">
                  <h3 className="text-sm font-semibold text-natural-100">{col.label}</h3>
                  <Pill tone="neutral">{columnTasks.length}</Pill>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[600px]">
                  {columnTasks.length === 0 && (
                    <p className="text-center text-portal-note-text text-sm py-8">
                      لا توجد مهام
                    </p>
                  )}
                  {columnTasks.map((t: TaskRow) => (
                    <button
                      key={t.id}
                      onClick={() => router.push(`/dashboard/admin/tasks/${t.id}`)}
                      className="w-full text-right bg-white rounded-xl border border-portal-divider p-3 hover:shadow-md transition-shadow space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-natural-100 line-clamp-2 flex-1">
                          {t.title}
                        </p>
                        <div
                          className={`mt-1 size-2.5 shrink-0 rounded-full ${
                            PRIORITY_COLORS[t.priority ?? "LOW"]
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-portal-note-text">
                        <span>{t.assigneeName}</span>
                        {t.dueDate && (
                          <span dir="ltr">{t.dueDate.slice(0, 10)}</span>
                        )}
                      </div>
                      {t.isOverdue && (
                        <Pill tone="danger">متأخرة</Pill>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable
        columns={[
          { id: "title", label: "المهمة" },
          { id: "project", label: "المشروع" },
          { id: "assignee", label: "المسند إلى" },
          { id: "status", label: "الحالة" },
          { id: "priority", label: "الأولوية" },
          { id: "dueDate", label: "تاريخ التسليم", align: "left" },
          { id: "overdue", label: "متأخرة" },
          { id: "actions", label: "الإجراءات", width: "100px" },
        ]}
        data={tasks}
        isLoading={isLoading}
        isError={isError}
        emptyState={{
          icon: ListChecks,
          message: "لا توجد مهام",
          hint: "لم يتم إنشاء أي مهام بعد",
        }}
        renderRow={(t: TaskRow) => (
          <tr
            key={t.id}
            className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
            onClick={() => router.push(`/dashboard/admin/tasks/${t.id}`)}
          >
            <td className="px-5 py-4 text-base font-medium text-natural-100">
              {t.title}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {t.projectName}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {t.assigneeName}
            </td>
            <td className="px-5 py-4">
              <StatusBadge
                status={t.status}
                label={TASK_STATUS_AR[t.status] ?? t.status}
              />
            </td>
            <td className="px-5 py-4">
              <Pill
                tone={
                  t.priority === "HIGH"
                    ? "danger"
                    : t.priority === "MEDIUM"
                      ? "warning"
                      : "neutral"
                }
              >
                {t.priority}
              </Pill>
            </td>
            <td
              className="px-5 py-4 text-sm text-portal-note-text text-left"
              dir="ltr"
            >
              {t.dueDate?.slice(0, 10) ?? "—"}
            </td>
            <td className="px-5 py-4">
              {t.isOverdue ? (
                <Pill tone="danger">متأخرة</Pill>
              ) : (
                <span className="text-sm text-portal-note-text">—</span>
              )}
            </td>
            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  title="إعادة تعيين"
                  onClick={() => {
                    setActionTask(t);
                    setActionType("reassign");
                  }}
                >
                  <UserCog className="size-3.5" />
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  title="تغيير الحالة"
                  onClick={() => {
                    setActionTask(t);
                    setActionType("status");
                  }}
                >
                  <Flag className="size-3.5" />
                </ActionButton>
              </div>
            </td>
          </tr>
        )}
      />
      )}
      <Dialog
        open={!!actionTask}
        onOpenChange={(o) => {
          if (!o) {
            setActionTask(null);
            setActionType(null);
          }
        }}
        title={
          actionType === "reassign" ? "إعادة تعيين المهمة" : "تغيير الحالة"
        }
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => {
                setActionTask(null);
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
              placeholder="ابحث عن موظف..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {users.map((u: any) => (
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
              {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
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
    </div>
  );
}
