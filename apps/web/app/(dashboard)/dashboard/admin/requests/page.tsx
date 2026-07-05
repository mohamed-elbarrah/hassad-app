"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ClipboardList, UserCog, Flag } from "lucide-react";
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
  useGetAdminRequestsQuery,
  useReassignRequestMutation,
  useForceRequestStatusMutation,
  type RequestRow,
} from "@/features/admin/adminApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { REQUEST_STATUS_AR } from "@hassad/shared";

const STATUS_OPTIONS = [
  { label: "الكل", value: "" },
  { label: "مقدم", value: "SUBMITTED" },
  { label: "قيد التأهيل", value: "QUALIFYING" },
  { label: "تمت الموافقة", value: "APPROVED" },
  { label: "مرفوض", value: "REJECTED" },
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

export default function AdminRequestsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [actionReq, setActionReq] = useState<RequestRow | null>(null);
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

  const { data, isLoading, isError } = useGetAdminRequestsQuery(filters);
  const [reassign] = useReassignRequestMutation();
  const [forceStatus] = useForceRequestStatusMutation();
  const { data: usersData } = useSearchUsersQuery({
    excludeRole: "CLIENT",
    limit: 20,
    search: userSearch || undefined,
  });

  const requests = data?.items ?? [];
  const users = usersData?.items ?? [];

  const handleFilterChange = useCallback(
    (key: string, values: string[]) =>
      setActiveFilters((prev) => ({ ...prev, [key]: values })),
    [],
  );

  const executeAction = async () => {
    if (!actionReq) return;
    try {
      if (actionType === "reassign") {
        if (!statusValue) {
          toast.error("يرجى اختيار موظف");
          return;
        }
        await reassign({ id: actionReq.id, assigneeId: statusValue }).unwrap();
        toast.success("تم إعادة التعيين");
      } else if (actionType === "status") {
        if (!statusValue || !reason) {
          toast.error("يرجى اختيار الحالة وكتابة السبب");
          return;
        }
        await forceStatus({
          id: actionReq.id,
          status: statusValue,
          reason,
        }).unwrap();
        toast.success("تم تغيير الحالة");
      }
      setActionReq(null);
      setActionType(null);
    } catch {
      toast.error("فشلت العملية");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="طلبات الخدمة"
        description={`إجمالي ${data?.total ?? 0} طلب`}
        icon={ClipboardList}
      />
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث عن طلب..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <FilterBar
          groups={[{ key: "status", label: "الحالة", options: STATUS_OPTIONS }]}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      </div>

      <DataTable
        columns={[
          { id: "id", label: "الرقم" },
          { id: "client", label: "العميل" },
          { id: "assignee", label: "المسؤول" },
          { id: "status", label: "الحالة" },
          { id: "services", label: "الخدمات" },
          { id: "age", label: "العمر (يوم)" },
          { id: "createdAt", label: "تاريخ الطلب", align: "left" },
          { id: "actions", label: "الإجراءات", width: "100px" },
        ]}
        data={requests}
        isLoading={isLoading}
        isError={isError}
        emptyState={{
          icon: ClipboardList,
          message: "لا توجد طلبات",
          hint: "لم يتم تقديم أي طلبات بعد",
        }}
        renderRow={(r: RequestRow) => (
          <tr
            key={r.id}
            className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
            onClick={() => router.push(`/dashboard/admin/requests/${r.id}`)}
          >
            <td className="px-5 py-4 text-sm font-mono text-portal-note-text">
              {r.id.slice(0, 8)}
            </td>
            <td className="px-5 py-4 text-base font-medium text-natural-100">
              {r.clientName}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {r.assigneeName}
            </td>
            <td className="px-5 py-4">
              <StatusBadge
                status={r.status}
                label={REQUEST_STATUS_AR[r.status] ?? r.status}
              />
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {r.servicesCount}
            </td>
            <td className="px-5 py-4">
              <Pill
                tone={
                  r.ageDays > 7
                    ? "danger"
                    : r.ageDays > 3
                      ? "warning"
                      : "neutral"
                }
              >
                {r.ageDays}
              </Pill>
            </td>
            <td
              className="px-5 py-4 text-sm text-portal-note-text text-left"
              dir="ltr"
            >
              {r.createdAt.slice(0, 10)}
            </td>
            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  title="إعادة تعيين"
                  onClick={() => {
                    setActionReq(r);
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
                    setActionReq(r);
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
        open={!!actionReq}
        onOpenChange={(o) => {
          if (!o) {
            setActionReq(null);
            setActionType(null);
          }
        }}
        title={
          actionType === "reassign" ? "إعادة تعيين الطلب" : "تغيير حالة الطلب"
        }
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => {
                setActionReq(null);
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
                  {u.name}
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
