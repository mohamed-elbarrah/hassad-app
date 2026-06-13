"use client";

import { useState, useMemo } from "react";
import { useGetLedgerQuery } from "@/features/finance/financeApi";
import { DataTable } from "@/components/design-system/DataTable";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  Search,
  ShieldCheck,
  Download,
  Filter,
  Calendar,
  ArrowRightLeft,
  ChevronDown,
  X,
  ArrowLeft,
  ArrowRight,
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
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
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
  const [filterOpen, setFilterOpen] = useState(false);

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
      todayCount: ledger.filter((l) => new Date(l.createdAt).toDateString() === today).length,
      sensitive: ledger.filter((l) => l.action.includes("PAY") || l.action.includes("SALARY")).length,
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

  const hasFilters = search || entityFilter !== "all";

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">سجل التدقيق المالي</h1>
          <p className="text-neutral-400 mt-1">
            تتبع جميع التغييرات والعمليات المالية بدقة.
          </p>
        </div>
        <ActionButton
          variant="outline"
          icon={<Download className="w-4 h-4" />}
          onClick={() => alert("سيتم تصدير السجل قريباً")}
        >
          تصدير السجل
        </ActionButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary-50">
              <FileText className="w-4 h-4 text-secondary-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">إجمالي العمليات</p>
              <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-50">
              <Clock className="w-4 h-4 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">عمليات اليوم</p>
              <p className="text-xl font-bold text-success-600">{stats.todayCount}</p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-alert-50">
              <AlertTriangle className="w-4 h-4 text-alert-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">تعديلات حساسة</p>
              <p className="text-xl font-bold text-alert-600">{stats.sensitive}</p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-50">
              <CheckCircle2 className="w-4 h-4 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">نظام التدقيق</p>
              <p className="text-xl font-bold text-success-600">نشط</p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <FormInputControl
            placeholder="بحث في السجلات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-11"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-natural-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Entity Filter */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              "flex items-center gap-2 h-11 px-3 rounded-xl border text-sm font-medium transition-all",
              "bg-natural-0 border-portal-card-border hover:border-secondary-500/40",
              filterOpen && "border-secondary-500 ring-2 ring-secondary-500/10",
              entityFilter !== "all" && "border-secondary-400/60 bg-secondary-50/50",
            )}
          >
            <Filter className="w-4 h-4" />
            <span>{ENTITY_OPTIONS.find((o) => o.value === entityFilter)?.label}</span>
            <ChevronDown
              className={cn("w-3.5 h-3.5 text-neutral-400 transition-transform", filterOpen && "rotate-180")}
            />
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className="absolute top-full right-0 mt-2 z-50 w-48 rounded-xl border border-portal-card-border bg-natural-0 shadow-lg overflow-hidden">
                {ENTITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setEntityFilter(opt.value);
                      setFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50",
                      entityFilter === opt.value && "bg-secondary-50 text-secondary-600 font-semibold",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

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
              <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-mono font-medium uppercase bg-neutral-100 text-neutral-600">
                {log.entity}
              </span>
              <span className="block text-[10px] text-neutral-400 mt-0.5 font-mono">{log.entityId?.slice(0, 8)}...</span>
            </td>
            <td className="px-5 py-4">
              <span className="text-sm text-neutral-500">{log.userId || "System"}</span>
            </td>
            <td className="px-5 py-4 text-xs text-neutral-400 font-mono max-w-[120px] truncate">
              {formatJson(log.before)}
            </td>
            <td className="px-5 py-4 text-xs text-secondary-600 font-mono max-w-[120px] truncate">
              {formatJson(log.after)}
            </td>
            <td className="px-5 py-4 text-left text-xs text-neutral-400 font-mono whitespace-nowrap">
              {formatDateTime(log.createdAt)}
            </td>
          </tr>
        )}
      />

      {/* Pagination */}
      {totalPages > 1 && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-400">
            عرض {(page - 1) * (data?.limit || 20) + 1}–
            {Math.min(page * (data?.limit || 20), total)} من {total} سجل
          </p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="outline"
              size="sm"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              السابق
            </ActionButton>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pg: number;
                if (totalPages <= 5) pg = i + 1;
                else if (page <= 3) pg = i + 1;
                else if (page >= totalPages - 2) pg = totalPages - 4 + i;
                else pg = page - 2 + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                      page === pg
                        ? "bg-secondary-500 text-white"
                        : "bg-natural-0 border border-portal-card-border hover:bg-neutral-50"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>
            <ActionButton
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              التالي
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
