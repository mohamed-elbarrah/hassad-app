"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ListChecks, UserCog, Flag } from "lucide-react";
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
import { toast } from "sonner";
import {
  useGetAdminTasksQuery,
  useReassignTaskMutation,
  useForceTaskTransitionMutation,
  type TaskRow,
} from "@/features/admin/adminApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { TASK_STATUS_AR } from "@hassad/shared";

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

export default function AdminTasksPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
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
      />
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
      </div>

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
