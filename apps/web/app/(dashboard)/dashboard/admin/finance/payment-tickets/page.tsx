"use client";

import { useState } from "react";
import { Ticket, Search, CheckCircle } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { toast } from "sonner";
import {
  useGetPaymentTicketsQuery,
  useResolvePaymentTicketMutation,
} from "@/features/finance/financeApi";

const STATUS_MAP: Record<string, string> = { OPEN: "مفتوح", RESOLVED: "تم الحل", CLOSED: "مغلق" };

export default function AdminPaymentTicketsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useGetPaymentTicketsQuery({ page, limit: 20 });
  const [resolveTicket] = useResolvePaymentTicketMutation();

  const tickets = data?.items ?? [];
  const filtered = search
    ? tickets.filter((t: any) => t.description?.includes(search) || t.invoiceId?.includes(search))
    : tickets;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title="تذاكر الدفع" description="إدارة تذاكر الدفع والمشكلات المالية" icon={Ticket} />

      <SurfaceCard>
        <div className="relative max-w-sm mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
          <FormInputControl placeholder="ابحث عن تذكرة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>

        <DataTable
          columns={[
            { id: "invoice", label: "الفاتورة" },
            { id: "description", label: "الوصف" },
            { id: "status", label: "الحالة" },
            { id: "createdAt", label: "تاريخ الإنشاء", align: "left" },
            { id: "actions", label: "", align: "left" },
          ]}
          data={filtered} isLoading={isLoading} isError={isError}
          emptyState={{ icon: Ticket, message: "لا توجد تذاكر دفع", hint: "لم يتم إنشاء أي تذاكر دفع بعد" }}
          renderRow={(t: any) => (
            <tr key={t.id} className="border-b border-portal-divider">
              <td className="px-5 py-3 text-sm font-medium">{t.invoiceId?.slice(0, 8) ?? "—"}</td>
              <td className="px-5 py-3 text-sm text-portal-note-text max-w-xs truncate">{t.description ?? "—"}</td>
              <td className="px-5 py-3"><StatusBadge status={t.status} label={STATUS_MAP[t.status] ?? t.status} /></td>
              <td className="px-5 py-3 text-sm text-portal-note-text text-left">{t.createdAt?.slice(0, 10) ?? "—"}</td>
              <td className="px-5 py-3 text-left">
                {t.status !== "RESOLVED" && t.status !== "CLOSED" && (
                  <ActionButton variant="ghost" size="sm" onClick={async () => {
                    try { await resolveTicket(t.id).unwrap(); toast.success("تم حل التذكرة"); } catch { toast.error("فشل"); }
                  }}>
                    <CheckCircle className="size-4 ml-1" />حل
                  </ActionButton>
                )}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
