"use client";

import { useState } from "react";
import {
  useGetAuditLogQuery,
  useGetAdminAuditStatsQuery,
  useGetAuditFiltersQuery,
} from "@/features/admin/adminApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pill } from "@/components/design-system/Pill";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollText, Filter, RefreshCw, ChevronLeft, BarChart3, Download } from "lucide-react";
import { formatDate } from "@/lib/format";

const ACTION_AR: Record<string, string> = {
  "admin.users.create": "إنشاء مستخدم",
  "admin.users.impersonate": "انتحال صلاحية",
  "admin.users.reset-password": "إعادة تعيين كلمة المرور",
  "admin.users.revoke-sessions": "إنهاء الجلسات",
  "admin.users.set-permissions": "تعديل الصلاحيات",
  "admin.users.activate": "تفعيل مستخدم",
  "admin.users.deactivate": "تعطيل مستخدم",
  "admin.users.changeRole": "تغيير دور المستخدم",
  "admin.users.reassignDepartment": "إعادة تعيين القسم",
  "admin.tasks.reassign": "إعادة تعيين مهمة",
  "admin.tasks.force-transition": "تغيير حالة مهمة",
  "admin.projects.reassign-pm": "إعادة تعيين مدير مشروع",
  "admin.projects.archive": "أرشفة مشروع",
  "admin.projects.force-transition": "تغيير حالة مشروع",
  "admin.finance.force-invoice-status": "تغيير حالة فاتورة",
  "ADMIN_FORCE_INVOICE_STATUS": "تغيير حالة فاتورة من الإدارة",
  "ADMIN_TRIGGER_REFUND": "استرداد مبلغ",
  "ADMIN_RETRY_WEBHOOK": "إعادة محاولة ويب هوك",
  "admin.contracts.cancel": "إلغاء عقد",
  "admin.contracts.renewal-alert": "تنبيه تجديد عقد",
  "admin.leads.reassign": "إعادة تعيين عميل محتمل",
  "admin.requests.reassign": "إعادة تعيين طلب",
  "admin.requests.force-transition": "تغيير حالة طلب",
  "admin.campaigns.pause": "إيقاف حملة مؤقتاً",
  "admin.campaigns.stop": "إنهاء حملة",
  CLIENT_CREATED: "إنشاء عميل",
  CLIENT_UPDATED: "تعديل عميل",
  PROPOSAL_SENT: "إرسال عرض فني",
  PROPOSAL_APPROVED: "قبول عرض فني",
  PROPOSAL_REJECTED: "رفض عرض فني",
  CONTRACT_CREATED: "إنشاء عقد",
  CONTRACT_SIGNED: "توقيع عقد",
  TASK_CREATED: "إنشاء مهمة",
  TASK_STATUS_CHANGED: "تغيير حالة مهمة",
  INVOICE_CREATED: "إنشاء فاتورة",
  PAYMENT_RECEIVED: "استلام دفعة",
};

const ENTITY_AR: Record<string, string> = {
  Invoice: "فاتورة",
  Task: "مهمة",
  Project: "مشروع",
  Contract: "عقد",
  Lead: "عميل محتمل",
  Proposal: "عرض فني",
  Campaign: "حملة",
  User: "مستخدم",
  Client: "عميل",
  Payment: "دفعة",
  Request: "طلب",
  WebhookLog: "سجل ويب هوك",
  Dispute: "نزاع",
  Setting: "إعدادات",
  Role: "دور",
  Department: "قسم",
  Service: "خدمة",
  NotificationTemplate: "قالب إشعار",
};

function formatValue(val: unknown): string {
  if (val == null) return "فارغ";
  if (typeof val === "boolean") return val ? "نعم" : "لا";
  return String(val);
}

function renderDiff(before: any, after: any) {
  if (!before && !after) return null;
  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  const entries: Array<{ key: string; oldVal: string; newVal: string }> = [];
  for (const key of allKeys) {
    const oldV = before?.[key];
    const newV = after?.[key];
    if (JSON.stringify(oldV) === JSON.stringify(newV)) continue;
    entries.push({
      key,
      oldVal: formatValue(oldV),
      newVal: formatValue(newV),
    });
  }
  return entries.length > 0 ? entries : null;
}

function exportCSV(logs: any[]) {
  const BOM = "\uFEFF";
  const headers = [
    "التاريخ",
    "العملية",
    "الكيان",
    "معرف الكيان",
    "المستخدم",
    "البريد الإلكتروني",
  ];
  const rows = logs.map((log) => [
    formatDate(log.createdAt),
    `"${ACTION_AR[log.action] ?? log.action}"`,
    ENTITY_AR[log.entity] ?? log.entity,
    log.entityId ?? "",
    `"${log.userName ?? ""}"`,
    `"${log.userEmail ?? ""}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "audit-log.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AuditLogPage() {
  const [tab, setTab] = useState("log");
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: filterOptions } = useGetAuditFiltersQuery();
  const { data: stats } = useGetAdminAuditStatsQuery(undefined, {
    skip: tab !== "stats",
  });

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
          tab === "log" ? (
            <div className="flex gap-2">
              <ActionButton
                variant="outline"
                size="md"
                onClick={() => exportCSV(logs)}
                disabled={logs.length === 0}
              >
                <Download className="size-4 ml-1" />
                تصدير CSV
              </ActionButton>
              <ActionButton
                variant="outline"
                size="md"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`size-4 ml-1 ${isFetching ? "animate-spin" : ""}`}
                />
                تحديث
              </ActionButton>
            </div>
          ) : null
        }
      />

      <Tabs value={tab} onValueChange={setTab} dir="rtl">
        <TabsList className="w-full justify-start gap-1">
          <TabsTrigger value="log">
            <ScrollText className="size-4 ml-1" />
            السجل
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="size-4 ml-1" />
            الإحصائيات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-4">
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SurfaceCard title="إجمالي السجلات">
                <p className="text-3xl font-bold text-secondary-500">
                  {stats.total.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </SurfaceCard>

              <SurfaceCard title="أكثر 5 عمليات تكراراً">
                <div className="space-y-2">
                  {stats.topActions.map((a, i) => (
                    <div
                      key={a.action}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-natural-100">
                        {i + 1}. {ACTION_AR[a.action] ?? a.action}
                      </span>
                      <Pill tone="blue" className="text-xs">
                        {a.count}
                      </Pill>
                    </div>
                  ))}
                  {stats.topActions.length === 0 && (
                    <p className="text-portal-note-text text-sm">
                      لا توجد بيانات
                    </p>
                  )}
                </div>
              </SurfaceCard>

              <SurfaceCard title="أكثر 5 مستخدمين نشاطاً">
                <div className="space-y-2">
                  {stats.topUsers.map((u, i) => (
                    <div
                      key={u.userId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-natural-100">
                        {i + 1}. {u.userName}
                      </span>
                      <Pill tone="neutral" className="text-xs">
                        {u.count}
                      </Pill>
                    </div>
                  ))}
                  {stats.topUsers.length === 0 && (
                    <p className="text-portal-note-text text-sm">
                      لا توجد بيانات
                    </p>
                  )}
                </div>
              </SurfaceCard>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin size-6 border-2 border-secondary-500 border-t-transparent rounded-full" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center p-4 bg-natural-0 rounded-2xl border border-portal-card-border">
            <Filter className="size-4 text-portal-icon shrink-0" />
            {filterOptions && (
              <>
                <Select
                  value={actionFilter}
                  onValueChange={(v) => {
                    setActionFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px] h-10 text-sm rounded-xl">
                    <SelectValue placeholder="كل العمليات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل العمليات</SelectItem>
                    {filterOptions.actions.map((a) => (
                      <SelectItem key={a} value={a}>
                        {ACTION_AR[a] ?? a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={entityFilter}
                  onValueChange={(v) => {
                    setEntityFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px] h-10 text-sm rounded-xl">
                    <SelectValue placeholder="كل الكيانات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الكيانات</SelectItem>
                    {filterOptions.entities.map((e) => (
                      <SelectItem key={e} value={e}>
                        {ENTITY_AR[e] ?? e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={userIdFilter}
                  onValueChange={(v) => {
                    setUserIdFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px] h-10 text-sm rounded-xl">
                    <SelectValue placeholder="كل المستخدمين" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المستخدمين</SelectItem>
                    {filterOptions.users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
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
                onClick={() =>
                  setExpandedRow(expandedRow === log.id ? null : log.id)
                }
              >
                <td
                  className="px-5 py-4 text-sm text-portal-note-text font-mono"
                  dir="ltr"
                >
                  {formatDate(log.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <Pill tone="blue" className="text-xs">
                    {ACTION_AR[log.action] ?? log.action}
                  </Pill>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-natural-100">
                      {ENTITY_AR[log.entity] ?? log.entity}
                    </span>
                    <span className="text-xs text-portal-note-text font-mono">
                      {log.entityId?.slice(0, 8)}...
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    {log.userName ? (
                      <span className="text-base text-natural-100">
                        {log.userName}
                      </span>
                    ) : (
                      <span className="text-sm text-portal-note-text">
                        نظام
                      </span>
                    )}
                    {log.userEmail && (
                      <span className="text-xs text-portal-note-text">
                        {log.userEmail}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <ChevronLeft
                    className={`size-3 text-portal-icon transition-transform ${expandedRow === log.id ? "-rotate-90" : ""}`}
                  />
                </td>
              </tr>
            )}
          />

          {/* Pagination */}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

          {/* Expanded Row Detail */}
          {expandedRow &&
            (() => {
              const log = logs.find((l) => l.id === expandedRow);
              if (!log) return null;
              const diffs = renderDiff(log.before, log.after);

              return (
                <SurfaceCard
                  title="تفاصيل العملية"
                  className="border-2 border-secondary-100"
                >
                  <div className="grid grid-cols-2 gap-4 text-base">
                    <div>
                      <span className="text-portal-note-text">العملية: </span>
                      <span className="font-semibold text-natural-100">
                        {ACTION_AR[log.action] ?? log.action}
                      </span>
                    </div>
                    <div>
                      <span className="text-portal-note-text">الكيان: </span>
                      <span className="text-natural-100">
                        {ENTITY_AR[log.entity] ?? log.entity} #{log.entityId}
                      </span>
                    </div>
                    <div>
                      <span className="text-portal-note-text">المستخدم: </span>
                      <span className="text-natural-100">
                        {log.userName ?? "نظام"} ({log.userEmail ?? "—"})
                      </span>
                    </div>
                    <div>
                      <span className="text-portal-note-text">التاريخ: </span>
                      <span className="text-natural-100" dir="ltr">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>

                  {diffs && diffs.length > 0 && (
                    <details className="mt-4">
                      <summary className="text-base text-secondary-500 cursor-pointer font-medium">
                        تغييرات الحقول ({diffs.length})
                      </summary>
                      <div className="mt-3 space-y-2">
                        {diffs.map((d) => (
                          <div
                            key={d.key}
                            className="bg-portal-bg p-3 rounded-xl text-sm"
                          >
                            <span className="font-medium text-natural-100 block mb-1">
                              {d.key}
                            </span>
                            <span className="text-portal-note-text">
                              القيمة القديمة:{" "}
                            </span>
                            <span className="text-danger-500 line-through">
                              {d.oldVal}
                            </span>
                            <span className="text-portal-note-text mx-2">
                              ←
                            </span>
                            <span className="text-portal-note-text">
                              القيمة الجديدة:{" "}
                            </span>
                            <span className="text-success-600">
                              {d.newVal}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {log.metadata && (
                    <details className="mt-2">
                      <summary className="text-base text-secondary-500 cursor-pointer font-medium">
                        بيانات إضافية
                      </summary>
                      <pre className="bg-portal-bg p-4 rounded-2xl overflow-auto max-h-40 text-portal-icon mt-3">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </SurfaceCard>
              );
            })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
