"use client";

import { useState } from "react";
import {
  useGetAuditLogQuery,
  useGetAuditFiltersQuery,
} from "@/features/admin/adminApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pill } from "@/components/design-system/Pill";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { ScrollText, Filter, RefreshCw, ChevronLeft } from "lucide-react";

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: filterOptions } = useGetAuditFiltersQuery();

  const filters = {
    ...(actionFilter && { action: actionFilter }),
    ...(entityFilter && { entity: entityFilter }),
    ...(userIdFilter && { userId: userIdFilter }),
    page,
    limit: 25,
  };

  const { data, isLoading, isFetching, refetch } = useGetAuditLogQuery(filters);

  const totalPages = data?.totalPages ?? 1;
  const logs = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="سجل النشاطات"
        description="جميع العمليات التي تمت في النظام مع تفاصيل كاملة"
        icon={ScrollText}
        actions={
          <ActionButton variant="outline" size="md" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            تحديث
          </ActionButton>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center p-4 bg-natural-0 rounded-2xl border border-portal-card-border">
        <Filter className="size-4 text-portal-icon shrink-0" />
        {filterOptions && (
          <>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[200px] h-10 text-sm rounded-xl">
                <SelectValue placeholder="كل العمليات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل العمليات</SelectItem>
                {filterOptions.actions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[180px] h-10 text-sm rounded-xl">
                <SelectValue placeholder="كل الكيانات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الكيانات</SelectItem>
                {filterOptions.entities.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userIdFilter} onValueChange={(v) => { setUserIdFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[200px] h-10 text-sm rounded-xl">
                <SelectValue placeholder="كل المستخدمين" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المستخدمين</SelectItem>
                {filterOptions.users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {data && (
          <span className="text-sm text-portal-note-text mr-auto">
            {data.total} نتيجة
          </span>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={[
          { id: "date", label: "التاريخ", width: "160px" },
          { id: "action", label: "العملية" },
          { id: "entity", label: "الكيان" },
          { id: "user", label: "المستخدم" },
          { id: "expand", label: "", width: "40px" },
        ]}
        data={logs}
        isLoading={isLoading}
        isError={false}
        emptyState={{
          icon: ScrollText,
          message: "لا توجد سجلات",
          hint: "ستظهر العمليات هنا فور حدوثها",
        }}
        renderRow={(log) => (
          <tr
            key={log.id}
            className="border-b-[1.5px] border-portal-divider cursor-pointer"
            onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
          >
            <td className="px-5 py-4 text-sm text-portal-note-text font-mono" dir="ltr">
              {formatDate(log.createdAt)}
            </td>
            <td className="px-5 py-4">
              <Pill tone="blue" className="text-xs">{log.action}</Pill>
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-base text-natural-100">{log.entity}</span>
                <span className="text-xs text-portal-note-text font-mono">{log.entityId?.slice(0, 8)}...</span>
              </div>
            </td>
            <td className="px-5 py-4">
              {log.userName ? (
                <span className="text-base text-natural-100">{log.userName}</span>
              ) : (
                <span className="text-sm text-portal-note-text">—</span>
              )}
            </td>
            <td className="px-5 py-4">
              <ChevronLeft className={`size-3 text-portal-icon transition-transform ${expandedRow === log.id ? "-rotate-90" : ""}`} />
            </td>
          </tr>
        )}
      />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Expanded Row Detail */}
      {expandedRow && (() => {
        const log = logs.find((l) => l.id === expandedRow);
        if (!log) return null;
        return (
          <SurfaceCard title="تفاصيل العملية" className="border-2 border-secondary-100">
            <div className="grid grid-cols-2 gap-4 text-base">
              <div>
                <span className="text-portal-note-text">العملية: </span>
                <span className="font-semibold text-natural-100">{log.action}</span>
              </div>
              <div>
                <span className="text-portal-note-text">الكيان: </span>
                <span className="text-natural-100">{log.entity} #{log.entityId}</span>
              </div>
              <div>
                <span className="text-portal-note-text">المستخدم: </span>
                <span className="text-natural-100">{log.userName ?? "نظام"} ({log.userEmail ?? "—"})</span>
              </div>
              <div>
                <span className="text-portal-note-text">التاريخ: </span>
                <span className="text-natural-100" dir="ltr">{formatDate(log.createdAt)}</span>
              </div>
            </div>
            {(log.metadata || log.before || log.after) && (
              <details className="mt-4">
                <summary className="text-base text-secondary-500 cursor-pointer font-medium">بيانات إضافية</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                  {log.before && (
                    <pre className="bg-portal-bg p-4 rounded-2xl overflow-auto max-h-40 text-portal-icon">
                      <span className="text-portal-note-text block mb-1">Before:</span>
                      {JSON.stringify(log.before, null, 2)}
                    </pre>
                  )}
                  {log.after && (
                    <pre className="bg-portal-bg p-4 rounded-2xl overflow-auto max-h-40 text-portal-icon">
                      <span className="text-portal-note-text block mb-1">After:</span>
                      {JSON.stringify(log.after, null, 2)}
                    </pre>
                  )}
                  {log.metadata && (
                    <pre className="bg-portal-bg p-4 rounded-2xl overflow-auto max-h-40 md:col-span-2 text-portal-icon">
                      <span className="text-portal-note-text block mb-1">Metadata:</span>
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </SurfaceCard>
        );
      })()}
    </div>
  );
}
