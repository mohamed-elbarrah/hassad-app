"use client";

import { useState, useEffect } from "react";
import { Search, UserCheck, UserX, Building2 } from "lucide-react";
import {
  useSearchUsersQuery,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  type UserDetail,
} from "@/features/users/usersApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { FilterPills } from "@/components/design-system/FilterPills";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const STATUS_FILTERS = [
  { label: "الكل", value: "all" },
  { label: "نشط", value: "active" },
  { label: "معطل", value: "inactive" },
];

export default function AdminClientsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebounce(searchInput, 400);

  const { data, isLoading, isError } = useSearchUsersQuery({
    search: debouncedSearch || undefined,
    role: "CLIENT",
    limit: 50,
  });

  const [deactivateUser, { isLoading: isDeactivating }] = useDeactivateUserMutation();
  const [reactivateUser, { isLoading: isReactivating }] = useReactivateUserMutation();
  const isToggling = isDeactivating || isReactivating;

  async function handleToggleActive(id: string, currentlyActive: boolean) {
    try {
      if (currentlyActive) {
        await deactivateUser(id).unwrap();
        toast.success("تم تعطيل حساب العميل.");
      } else {
        await reactivateUser(id).unwrap();
        toast.success("تم تفعيل حساب العميل.");
      }
    } catch {
      toast.error("فشلت العملية. يرجى المحاولة مجدداً.");
    }
  }

  const allClients = (data?.items ?? []) as UserDetail[];
  const clients = allClients.filter((c) => {
    if (statusFilter === "active") return c.isActive;
    if (statusFilter === "inactive") return !c.isActive;
    return true;
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إدارة حسابات العملاء"
        description={`إجمالي ${data?.total ?? 0} عميل`}
        icon={Building2}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث بالاسم أو الإيميل..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <FilterPills options={STATUS_FILTERS} active={statusFilter} onChange={setStatusFilter} />
      </div>

      <DataTable
        columns={[
          { id: "name", label: "الاسم" },
          { id: "email", label: "البريد الإلكتروني" },
          { id: "status", label: "الحالة" },
          { id: "createdAt", label: "تاريخ الإنشاء", align: "left" },
          { id: "actions", label: "الإجراءات", width: "120px" },
        ]}
        data={clients}
        isLoading={isLoading}
        isError={isError}
        errorMessage="حدث خطأ أثناء تحميل العملاء. يرجى تحديث الصفحة."
        emptyState={{
          icon: Building2,
          message: "لا يوجد عملاء",
          hint: "لا توجد نتائج مطابقة للبحث",
        }}
        renderRow={(client) => (
          <tr key={client.id} className="border-b-[1.5px] border-portal-divider">
            <td className="px-5 py-4 text-base font-medium text-natural-100">{client.name}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text" dir="ltr">{client.email}</td>
            <td className="px-5 py-4">
              <StatusBadge status={client.isActive ? "ACTIVE" : "STOPPED"} label={client.isActive ? "نشط" : "معطل"} />
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text text-left" dir="ltr">
              {formatDate(client.createdAt)}
            </td>
            <td className="px-5 py-4">
              <ActionButton
                variant="ghost"
                size="sm"
                disabled={isToggling}
                onClick={() => handleToggleActive(client.id, client.isActive)}
                className={client.isActive ? "text-danger-500 hover:text-danger-500" : "text-success-600 hover:text-success-600"}
              >
                {client.isActive ? (
                  <><UserX className="size-3.5 mr-1" />تعطيل</>
                ) : (
                  <><UserCheck className="size-3.5 mr-1" />تفعيل</>
                )}
              </ActionButton>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
