"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, Archive, UserCog, Flag } from "lucide-react";
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
  useGetAdminProjectsQuery,
  useReassignProjectPmMutation,
  useArchiveProjectMutation,
  useForceProjectStatusMutation,
  type ProjectRow,
} from "@/features/admin/adminApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { PROJECT_STATUS_AR } from "@hassad/shared";

const STATUS_OPTIONS = [
  { label: "الكل", value: "" },
  { label: "نشط", value: "ACTIVE" },
  { label: "تخطيط", value: "PLANNING" },
  { label: "مكتمل", value: "COMPLETED" },
  { label: "معلق", value: "ON_HOLD" },
  { label: "ملغي", value: "CANCELLED" },
];

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
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

  const projects = data?.items ?? [];
  const pms = pmData?.items ?? [];

  const handleFilterChange = useCallback((key: string, values: string[]) => {
    setActiveFilters((prev) => ({ ...prev, [key]: values }));
  }, []);

  const filterGroups: FilterGroup[] = [
    { key: "status", label: "الحالة", options: STATUS_OPTIONS },
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
      />

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
        <FilterBar
          groups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      </div>

      <DataTable
        columns={[
          { id: "name", label: "المشروع" },
          { id: "client", label: "العميل" },
          { id: "pm", label: "مدير المشروع" },
          { id: "status", label: "الحالة" },
          { id: "completion", label: "الإنجاز" },
          { id: "overdue", label: "المهام المتأخرة" },
          { id: "dates", label: "التاريخ" },
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
