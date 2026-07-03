"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, FileSignature, XCircle, Bell } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import { useGetAdminContractsQuery, useCancelContractMutation, useTriggerRenewalAlertMutation, type ContractRow } from "@/features/admin/adminApi";

const STATUS_OPTIONS = [
  { label: "الكل", value: "" }, { label: "مسودة", value: "DRAFT" }, { label: "نشط", value: "ACTIVE" },
  { label: "مكتمل", value: "COMPLETED" }, { label: "ملغي", value: "CANCELLED" },
];
const STATUS_MAP: Record<string, string> = { DRAFT: "مسودة", ACTIVE: "نشط", COMPLETED: "مكتمل", CANCELLED: "ملغي" };

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

export default function AdminContractsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [cancelContract, setCancelContract] = useState<ContractRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const debouncedSearch = useDebounce(searchInput, 400);
  const filters: any = { search: debouncedSearch || undefined, ...activeFilters };
  if (filters.status?.[0]) filters.status = filters.status[0];

  const { data, isLoading, isError } = useGetAdminContractsQuery(filters);
  const [cancel] = useCancelContractMutation();
  const [triggerAlert] = useTriggerRenewalAlertMutation();

  const contracts = data?.items ?? [];

  const handleFilterChange = useCallback((key: string, values: string[]) => setActiveFilters((prev) => ({ ...prev, [key]: values })), []);

  const handleCancel = async () => {
    if (!cancelContract || !cancelReason.trim()) { toast.error("يرجى كتابة سبب الإلغاء"); return; }
    try { await cancel({ id: cancelContract.id, reason: cancelReason }).unwrap(); toast.success("تم إلغاء العقد"); setCancelContract(null); setCancelReason(""); }
    catch { toast.error("فشل إلغاء العقد"); }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title="العقود" description={`إجمالي ${data?.total ?? 0} عقد`} icon={FileSignature} />
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl placeholder="ابحث عن عقد..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pr-9" />
        </div>
        <FilterBar groups={[{ key: "status", label: "الحالة", options: STATUS_OPTIONS }]} activeFilters={activeFilters} onFilterChange={handleFilterChange} />
      </div>

      <DataTable
        columns={[
          { id: "title", label: "العقد" }, { id: "client", label: "العميل" }, { id: "type", label: "النوع" },
          { id: "status", label: "الحالة" }, { id: "value", label: "القيمة" }, { id: "endDate", label: "تاريخ الانتهاء", align: "left" },
          { id: "renewal", label: "التجديد" }, { id: "actions", label: "الإجراءات", width: "120px" },
        ]}
        data={contracts} isLoading={isLoading} isError={isError}
        emptyState={{ icon: FileSignature, message: "لا توجد عقود", hint: "لم يتم إنشاء أي عقود بعد" }}
        renderRow={(c: ContractRow) => (
          <tr key={c.id} className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50" onClick={() => router.push(`/dashboard/admin/contracts/${c.id}`)}>
            <td className="px-5 py-4 text-base font-medium text-natural-100">{c.title}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text">{c.clientName}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text">{c.type}</td>
            <td className="px-5 py-4"><StatusBadge status={c.status} label={STATUS_MAP[c.status] ?? c.status} /></td>
            <td className="px-5 py-4 text-sm font-medium">{c.totalValue.toLocaleString()} {c.currency}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text text-left" dir="ltr">{c.endDate?.slice(0, 10) ?? "—"}</td>
            <td className="px-5 py-4">{c.pendingRenewalAlerts > 0 ? <Pill tone="warning">{c.pendingRenewalAlerts}</Pill> : <span className="text-sm text-portal-note-text">—</span>}</td>
            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1">
                <ActionButton variant="ghost" size="sm" className="h-8 w-8" title="إلغاء" onClick={() => { setCancelContract(c); setCancelReason(""); }}><XCircle className="size-3.5" /></ActionButton>
                <ActionButton variant="ghost" size="sm" className="h-8 w-8" title="تفعيل تنبيه التجديد" onClick={async () => { try { await triggerAlert(c.id).unwrap(); toast.success("تم تفعيل تنبيه التجديد"); } catch { toast.error("فشل"); } }}><Bell className="size-3.5" /></ActionButton>
              </div>
            </td>
          </tr>
        )}
      />

      <Dialog open={!!cancelContract} onOpenChange={(o) => { if (!o) setCancelContract(null); }}
        title="إلغاء العقد" description="هل أنت متأكد من إلغاء هذا العقد؟"
        footer={<div className="flex gap-2 justify-end"><ActionButton variant="outline" onClick={() => setCancelContract(null)}>إلغاء</ActionButton><ActionButton variant="danger" onClick={handleCancel}>تأكيد الإلغاء</ActionButton></div>}>
        <FormInputControl placeholderسبب الإلغاء..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
      </Dialog>
    </div>
  );
}
