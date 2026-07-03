"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, UserCog } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { Pill } from "@/components/design-system/Pill";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import { useGetAdminLeadsQuery, useReassignLeadMutation, type LeadRow } from "@/features/admin/adminApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";

const STAGE_OPTIONS = [
  { label: "الكل", value: "" }, { label: "جديد", value: "NEW" }, { label: "مؤهل", value: "QUALIFIED" },
  { label: "عرض", value: "PROPOSAL" }, { label: "تفاوض", value: "NEGOTIATION" }, { label: "مغلق", value: "CLOSED" },
];
const STAGE_MAP: Record<string, string> = { NEW: "جديد", QUALIFIED: "مؤهل", PROPOSAL: "عرض", NEGOTIATION: "تفاوض", CLOSED: "مغلق" };

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

export default function AdminLeadsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [actionLead, setActionLead] = useState<LeadRow | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const debouncedSearch = useDebounce(searchInput, 400);
  const filters: any = { search: debouncedSearch || undefined, ...activeFilters };
  if (filters.stage?.[0]) filters.stage = filters.stage[0];

  const { data, isLoading, isError } = useGetAdminLeadsQuery(filters);
  const [reassign] = useReassignLeadMutation();
  const { data: usersData } = useSearchUsersQuery({ role: "SALES", limit: 20, search: userSearch || undefined });

  const leads = data?.items ?? [];
  const salesUsers = usersData?.items ?? [];

  const handleFilterChange = useCallback((key: string, values: string[]) => setActiveFilters((prev) => ({ ...prev, [key]: values })), []);

  const handleReassign = async () => {
    if (!actionLead || !selectedUserId) { toast.error("يرجى اختيار موظف"); return; }
    try { await reassign({ id: actionLead.id, assigneeId: selectedUserId }).unwrap(); toast.success("تم إعادة التعيين"); setActionLead(null); setSelectedUserId(""); }
    catch { toast.error("فشلت العملية"); }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title="العملاء المحتملون" description={`إجمالي ${data?.total ?? 0} عميل محتمل`} icon={TrendingUp} />
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl placeholder="ابحث بالاسم أو الشركة..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pr-9" />
        </div>
        <FilterBar groups={[{ key: "stage", label: "المرحلة", options: STAGE_OPTIONS }]} activeFilters={activeFilters} onFilterChange={handleFilterChange} />
      </div>

      <DataTable
        columns={[
          { id: "company", label: "الشركة" }, { id: "contact", label: "جهة الاتصال" }, { id: "assignee", label: "المسؤول" },
          { id: "stage", label: "المرحلة" }, { id: "source", label: "المصدر" }, { id: "attempts", label: "محاولات التواصل" },
          { id: "lastContact", label: "آخر تواصل", align: "left" }, { id: "actions", label: "الإجراءات", width: "60px" },
        ]}
        data={leads} isLoading={isLoading} isError={isError}
        emptyState={{ icon: TrendingUp, message: "لا توجد عملاء محتملين", hint: "لم يتم إضافة أي عملاء محتملين بعد" }}
        renderRow={(l: LeadRow) => (
          <tr key={l.id} className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50" onClick={() => router.push(`/dashboard/admin/leads/${l.id}`)}>
            <td className="px-5 py-4 text-base font-medium text-natural-100">{l.companyName}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text">{l.contactName}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text">{l.assigneeName}</td>
            <td className="px-5 py-4"><Pill tone="blue">{STAGE_MAP[l.pipelineStage] ?? l.pipelineStage}</Pill></td>
            <td className="px-5 py-4 text-sm text-portal-note-text">{l.source ?? "—"}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text">{l.contactAttemptCount}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text text-left" dir="ltr">{l.lastContactAt?.slice(0, 10) ?? "—"}</td>
            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
              <ActionButton variant="ghost" size="sm" className="h-8 w-8" title="إعادة تعيين" onClick={() => { setActionLead(l); setSelectedUserId(""); }}><UserCog className="size-3.5" /></ActionButton>
            </td>
          </tr>
        )}
      />

      <Dialog open={!!actionLead} onOpenChange={(o) => { if (!o) setActionLead(null); }}
        title="إعادة تعيين العميل المحتمل"
        footer={<div className="flex gap-2 justify-end"><ActionButton variant="outline" onClick={() => setActionLead(null)}>إلغاء</ActionButton><ActionButton onClick={handleReassign}>تأكيد</ActionButton></div>}>
        <div className="space-y-4">
          <FormInputControl placeholder="ابحث عن موظف مبيعات..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {salesUsers.map((u: any) => (
              <button key={u.id} onClick={() => setSelectedUserId(u.id)}
                className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-colors ${selectedUserId === u.id ? "bg-secondary-50 text-secondary-600" : "hover:bg-badge-gray-bg"}`}>{u.name} — {u.email}</button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
