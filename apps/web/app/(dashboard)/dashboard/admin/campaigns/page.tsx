"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, BarChart3, PauseCircle, StopCircle, Download } from "lucide-react";
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
import { toast } from "sonner";
import {
  useGetAdminCampaignsQuery,
  usePauseCampaignMutation,
  useEndCampaignMutation,
  type CampaignRow,
} from "@/features/admin/adminApi";
import { CAMPAIGN_STATUS_AR } from "@hassad/shared";

const STATUS_OPTIONS = [
  { label: "الكل", value: "" },
  { label: "تخطيط", value: "PLANNING" },
  { label: "نشط", value: "ACTIVE" },
  { label: "متوقف", value: "PAUSED" },
  { label: "منتهي", value: "ENDED" },
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

export default function AdminCampaignsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [confirmAction, setConfirmAction] = useState<{
    campaign: CampaignRow;
    action: "pause" | "end";
  } | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);
  const filters: any = {
    search: debouncedSearch || undefined,
    ...activeFilters,
  };
  if (filters.status?.[0]) filters.status = filters.status[0];
  if (filters.overspentOnly?.[0]) filters.overspentOnly = "true";

  const { data, isLoading, isError } = useGetAdminCampaignsQuery(filters);
  const [pause] = usePauseCampaignMutation();
  const [end] = useEndCampaignMutation();

  const campaigns = data?.items ?? [];

  const handleFilterChange = useCallback(
    (key: string, values: string[]) =>
      setActiveFilters((prev) => ({ ...prev, [key]: values })),
    [],
  );

  const executeAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.action === "pause") {
        await pause(confirmAction.campaign.id).unwrap();
        toast.success("تم إيقاف الحملة مؤقتاً");
      } else {
        await end(confirmAction.campaign.id).unwrap();
        toast.success("تم إنهاء الحملة");
      }
      setConfirmAction(null);
    } catch {
      toast.error("فشلت العملية");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="الحملات التسويقية"
        description={`إجمالي ${data?.total ?? 0} حملة`}
        icon={BarChart3}
        actions={
          <button
            onClick={() => exportCSV(campaigns, "الحملات")}
            className="inline-flex items-center gap-2 rounded-xl border border-portal-divider px-4 py-2 text-sm font-medium hover:bg-badge-gray-bg transition-colors"
          >
            <Download className="size-4" />
            تصدير CSV
          </button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الحملات" value={data?.total ?? 0} icon={BarChart3} />
        <StatCard title="نشطة" value={campaigns.filter((c) => c.status === "ACTIVE").length} variant="success" />
        <StatCard title="متوقفة" value={campaigns.filter((c) => c.status === "PAUSED").length} variant="warning" />
        <StatCard title="منتهية" value={campaigns.filter((c) => c.status === "ENDED").length} variant="default" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث عن حملة..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <FilterBar
          groups={[
            { key: "status", label: "الحالة", options: STATUS_OPTIONS },
            {
              key: "overspentOnly",
              label: "تجاوز الميزانية",
              options: [{ label: "تجاوز الميزانية", value: "true" }],
            },
          ]}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      </div>

      <DataTable
        columns={[
          { id: "name", label: "الحملة" },
          { id: "client", label: "العميل" },
          { id: "manager", label: "المسؤول" },
          { id: "platform", label: "المنصة" },
          { id: "status", label: "الحالة" },
          { id: "budget", label: "الميزانية" },
          { id: "spent", label: "المصروف" },
          { id: "impressions", label: "مرات الظهور" },
          { id: "clicks", label: "النقرات" },
          { id: "ctr", label: "CTR" },
          { id: "conversions", label: "التحويلات" },
          { id: "roi", label: "ROI" },
          { id: "overspent", label: "تجاوز" },
          { id: "actions", label: "الإجراءات", width: "100px" },
        ]}
        data={campaigns}
        isLoading={isLoading}
        isError={isError}
        emptyState={{
          icon: BarChart3,
          message: "لا توجد حملات",
          hint: "لم يتم إنشاء أي حملات بعد",
        }}
        renderRow={(c: CampaignRow) => (
          <tr
            key={c.id}
            className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
            onClick={() => router.push(`/dashboard/admin/campaigns/${c.id}`)}
          >
            <td className="px-5 py-4 text-base font-medium text-natural-100">
              {c.name}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {c.clientName}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {c.managedByName}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {c.platform ?? "—"}
            </td>
            <td className="px-5 py-4">
              <StatusBadge
                status={c.status}
                label={CAMPAIGN_STATUS_AR[c.status] ?? c.status}
              />
            </td>
            <td className="px-5 py-4 text-sm font-medium">
              {c.budgetTotal.toLocaleString()}
            </td>
            <td className="px-5 py-4 text-sm">
              {c.budgetSpent.toLocaleString()}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {(c as any).impressions?.toLocaleString() ?? "—"}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {(c as any).clicks?.toLocaleString() ?? "—"}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {(c as any).ctr != null ? `${(c as any).ctr}%` : "—"}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {(c as any).conversions?.toLocaleString() ?? "—"}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {(c as any).roi != null ? `${(c as any).roi}%` : "—"}
            </td>
            <td className="px-5 py-4">
              {c.isOverspent ? (
                <Pill tone="danger">تجاوز</Pill>
              ) : (
                <span className="text-sm text-portal-note-text">—</span>
              )}
            </td>
            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1">
                {c.status === "ACTIVE" && (
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    title="إيقاف مؤقت"
                    onClick={() =>
                      setConfirmAction({ campaign: c, action: "pause" })
                    }
                  >
                    <PauseCircle className="size-3.5" />
                  </ActionButton>
                )}
                {["ACTIVE", "PAUSED"].includes(c.status) && (
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    title="إنهاء"
                    onClick={() =>
                      setConfirmAction({ campaign: c, action: "end" })
                    }
                  >
                    <StopCircle className="size-3.5" />
                  </ActionButton>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      <Dialog
        open={!!confirmAction}
        onOpenChange={(o) => {
          if (!o) setConfirmAction(null);
        }}
        title={
          confirmAction?.action === "pause"
            ? "إيقاف الحملة مؤقتاً"
            : "إنهاء الحملة"
        }
        description={`هل أنت متأكد من ${confirmAction?.action === "pause" ? "إيقاف" : "إنهاء"} حملة "${confirmAction?.campaign.name}"؟`}
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => setConfirmAction(null)}
            >
              إلغاء
            </ActionButton>
            <ActionButton onClick={executeAction}>تأكيد</ActionButton>
          </div>
        }
      >
        <div />
      </Dialog>
    </div>
  );
}
