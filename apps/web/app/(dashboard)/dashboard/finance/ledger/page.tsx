"use client";

import { useState, useMemo } from "react";
import { useGetLedgerQuery } from "@/features/finance/financeApi";
import { FinancePageHeader } from "@/components/dashboard/finance/shared/FinancePageHeader";

import { DataTable } from "@/components/design-system/DataTable";
import { MetricCard } from "@/components/design-system/MetricCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pagination } from "@/components/design-system/Pagination";
import { Popover } from "@/components/design-system/Popover";
import {
  Search,
  ShieldCheck,
  Download,
  Filter,
  ChevronDown,
  X,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ENTITY_OPTIONS = [
  { value: "all", label: "جميع الكيانات" },
  { value: "INVOICE", label: "الفواتير" },
  { value: "SALARY", label: "الرواتب" },
  { value: "PAYMENT", label: "المدفوعات" },
  { value: "CONTRACT", label: "العقود" },
  { value: "EMPLOYEE", label: "الموظفين" },
  { value: "CLIENT", label: "العملاء" },
];

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

function formatDateTime(d: string | Date) {
  const date = new Date(d);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} · ${date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatJson(value: any): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  try {
    const str = JSON.stringify(value);
    if (str.length <= 60) return str;
    return str.substring(0, 60) + "...";
  } catch {
    return String(value);
  }
}

export default function LedgerPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const { data, isLoading } = useGetLedgerQuery({ page });

  const ledger = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const filtered = useMemo(() => {
    let result = ledger;
    if (entityFilter !== "all") {
      result = result.filter((l) => l.entity === entityFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          (l.userId || "system").toLowerCase().includes(q) ||
          (l.entityId || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [ledger, search, entityFilter]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total,
      todayCount: ledger.filter(
        (l) => new Date(l.createdAt).toDateString() === today,
      ).length,
      sensitive: ledger.filter(
        (l) => l.action.includes("PAY") || l.action.includes("SALARY"),
      ).length,
    };
  }, [ledger, total]);

  const emptyState =
    search || entityFilter !== "all"
      ? {
          icon: Search,
          message: "لا توجد نتائج مطابقة",
          hint: "جرب تعديل البحث أو الفلتر لعرض المزيد.",
        }
      : {
          icon: ShieldCheck,
          message: "لا توجد سجلات حالياً",
          hint: "ستظهر العمليات المالية هنا فور حدوثها.",
        };

  const hasFilters = !!(search || entityFilter !== "all");

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <FinancePageHeader
        title="سجل التدقيق المالي"
        description="تتبع جميع التغييرات والعمليات المالية بدقة."
        icon={ShieldCheck}
        actions={
          <ActionButton
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            onClick={() => alert("سيتم تصدير السجل قريباً")}
          >
            تصدير السجل
          </ActionButton>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="إجمالي العمليات"
          value={stats.total.toLocaleString()}
          icon={FileText}
          variant="default"
        />
        <MetricCard
          title="عمليات اليوم"
          value={stats.todayCount}
          icon={Clock}
          variant="success"
        />
        <MetricCard
          title="تعديلات حساسة"
          value={stats.sensitive}
          icon={AlertTriangle}
          variant={stats.sensitive > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="نظام التدقيق"
          value="نشط"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-note-text pointer-events-none" />
          <input
            placeholder="بحث في السجلات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pr-10 rounded-xl border border-portal-card-border bg-natural-0 px-3 text-sm focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-note-text hover:text-natural-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Entity Filter using Popover */}
        <Popover
          trigger={
            <button
              className={cn(
                "flex items-center gap-2 h-11 px-3 rounded-xl border text-sm font-medium transition-all",
                "bg-natural-0 border-portal-card-border hover:border-secondary-500/40",
                entityFilter !== "all" &&
                  "border-secondary-400/60 bg-secondary-50/50",
              )}
            >
              <Filter className="w-4 h-4" />
              <span>
                {ENTITY_OPTIONS.find((o) => o.value === entityFilter)?.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-portal-note-text" />
            </button>
          }
          align="start"
          contentClassName="p-2 min-w-[180px]"
        >
          <div className="flex flex-col gap-1">
            {ENTITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setEntityFilter(opt.value)}
                className={cn(
                  "w-full text-right px-3 py-2 text-sm rounded-lg transition-colors hover:bg-badge-gray-bg",
                  entityFilter === opt.value &&
                    "bg-secondary-50 text-secondary-600 font-semibold",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Popover>

        {/* Clear */}
        {hasFilters && (
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setEntityFilter("all");
            }}
          >
            <X className="w-4 h-4" />
            مسح الفلاتر
          </ActionButton>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={[
          { id: "action", label: "العملية" },
          { id: "entity", label: "الكيان" },
          { id: "user", label: "المستخدم" },
          { id: "before", label: "السابق" },
          { id: "after", label: "الجديد" },
          { id: "date", label: "التاريخ", align: "left" },
        ]}
        data={filtered}
        isLoading={isLoading}
        isError={false}
        emptyState={emptyState}
        renderRow={(log) => (
          <tr className="border-b-[1.5px] border-portal-divider">
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary-500 shrink-0" />
                <span className="font-bold text-sm">{log.action}</span>
              </div>
            </td>
            <td className="px-5 py-4">
              <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-mono font-medium uppercase bg-badge-gray-bg text-natural-100">
                {log.entity}
              </span>
              <span className="block text-[10px] text-portal-note-text mt-0.5 font-mono">
                {log.entityId?.slice(0, 8)}...
              </span>
            </td>
            <td className="px-5 py-4">
              <span className="text-sm text-portal-note-text">
                {log.userId || "System"}
              </span>
            </td>
            <td className="px-5 py-4 text-xs text-portal-note-text font-mono max-w-[120px] truncate">
              {formatJson(log.before)}
            </td>
            <td className="px-5 py-4 text-xs text-secondary-600 font-mono max-w-[120px] truncate">
              {formatJson(log.after)}
            </td>
            <td className="px-5 py-4 text-left text-xs text-portal-note-text font-mono whitespace-nowrap">
              {formatDateTime(log.createdAt)}
            </td>
          </tr>
        )}
      />

      {/* Pagination */}
      {totalPages > 1 && filtered.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
