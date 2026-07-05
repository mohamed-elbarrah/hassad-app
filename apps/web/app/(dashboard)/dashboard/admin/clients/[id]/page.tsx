"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  FileText,
  FolderKanban,
  Receipt,
  CreditCard,
  Activity,
  Globe,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { DataTable } from "@/components/design-system/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { ActionButton } from "@/components/design-system/ActionButton";
import { toast } from "sonner";
import { useGetAdminClientFullQuery, useGetAdminClientHistoryQuery } from "@/features/admin/adminClientsApi";
import { useRegeneratePortalTokenMutation } from "@/features/admin/adminApi";
import { EmptyState } from "@/components/design-system/EmptyState";
import { formatDate, formatCurrency, formatRelativeTime } from "@/lib/format";

const TABS = [
  { value: "profile", label: "الملف الشخصي" },
  { value: "contracts", label: "العقود" },
  { value: "projects", label: "المشاريع" },
  { value: "invoices", label: "الفواتير" },
  { value: "payments", label: "المدفوعات" },
  { value: "activity", label: "سجل النشاط" },
  { value: "portal", label: "البوابة" },
];

export default function AdminClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const [activeTab, setActiveTab] = useState("profile");
  const [historyPage, setHistoryPage] = useState(1);

  const { data: client, isLoading } = useGetAdminClientFullQuery(clientId);
  const { data: historyData, isLoading: isHistoryLoading } = useGetAdminClientHistoryQuery(
    { id: clientId, page: historyPage, limit: 20 },
  );
  const [regenerateToken] = useRegeneratePortalTokenMutation();

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("فشل النسخ");
    }
  };

  const handleRegenerateToken = async () => {
    try {
      await regenerateToken(clientId).unwrap();
      toast.success("تم تجديد رمز البوابة");
    } catch {
      toast.error("فشل تجديد الرمز");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-4 w-72 animate-pulse rounded-lg bg-neutral-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-100" />
          </div>
        </div>
        <div className="h-96 w-full animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={client?.companyName ?? "العميل"}
        description={client?.contactName ?? ""}
        icon={Building2}
        actions={
          <div className="flex gap-2">
            <ActionButton variant="outline" size="md" onClick={() => router.push("/dashboard/admin/clients")}>
              <ArrowRight className="size-4 ml-1" />
              العودة
            </ActionButton>
            {client?.status && (
              <StatusBadge
                status={client.status === "ACTIVE" ? "ACTIVE" : "STOPPED"}
                label={client.status === "ACTIVE" ? "نشط" : "غير نشط"}
              />
            )}
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab 1: Profile */}
        <TabsContent value="profile" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SurfaceCard title="معلومات الشركة" icon={Building2}>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">اسم الشركة</span>
                  <span className="text-sm font-medium">{client?.companyName ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">نوع النشاط</span>
                  <span className="text-sm font-medium">{client?.businessType ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">تاريخ الإنشاء</span>
                  <span className="text-sm font-medium">{formatDate(client?.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">الحالة</span>
                  <StatusBadge
                    status={client?.isActive ? "ACTIVE" : "STOPPED"}
                    label={client?.isActive ? "نشط" : "غير نشط"}
                  />
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard title="معلومات الاتصال" icon={User}>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">جهة الاتصال</span>
                  <span className="text-sm font-medium">{client?.contactName ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">البريد الإلكتروني</span>
                  <span className="text-sm font-medium" dir="ltr">{client?.email ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">رقم الجوال</span>
                  <span className="text-sm font-medium" dir="ltr">{client?.phone ?? "—"}</span>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard title="إعدادات الحساب" icon={Globe}>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">دخول البوابة</span>
                  <StatusBadge
                    status={client?.hasPortalAccess ? "ACTIVE" : "STOPPED"}
                    label={client?.hasPortalAccess ? "مفعل" : "غير مفعل"}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">إكمال التسجيل</span>
                  <StatusBadge
                    status={client?.intakeCompleted ? "COMPLETED" : "PENDING"}
                    label={client?.intakeCompleted ? "مكتمل" : "غير مكتمل"}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">آخر تسجيل دخول</span>
                  <span className="text-sm font-medium">
                    {client?.lastLoginAt ? formatRelativeTime(client.lastLoginAt) : "—"}
                  </span>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard title="المدير المسؤول" icon={User}>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">الاسم</span>
                  <span className="text-sm font-medium">{client?.managerName ?? "—"}</span>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </TabsContent>

        {/* Tab 2: Contracts */}
        <TabsContent value="contracts" className="mt-4">
          <SurfaceCard>
            {client?.contracts?.length > 0 ? (
              <DataTable
                columns={[
                  { id: "title", label: "العنوان" },
                  { id: "value", label: "القيمة" },
                  { id: "status", label: "الحالة" },
                  { id: "startDate", label: "تاريخ البداية" },
                  { id: "endDate", label: "تاريخ النهاية" },
                ]}
                data={client.contracts}
                isLoading={false}
                isError={false}
                emptyState={{ icon: FileText, message: "لا توجد عقود", hint: "" }}
                renderCells={(c: any) => [
                  <td key="title" className="px-5 py-3 text-sm font-medium">{c.title}</td>,
                  <td key="value" className="px-5 py-3 text-sm">{formatCurrency(c.totalValue)}</td>,
                  <td key="status" className="px-5 py-3"><StatusBadge status={c.status} /></td>,
                  <td key="startDate" className="px-5 py-3 text-sm text-portal-note-text">{formatDate(c.startDate)}</td>,
                  <td key="endDate" className="px-5 py-3 text-sm text-portal-note-text">{formatDate(c.endDate)}</td>,
                ]}
              />
            ) : (
              <EmptyState icon={FileText} title="لا توجد عقود" hint="لم يتم إضافة عقود لهذا العميل بعد" />
            )}
          </SurfaceCard>
        </TabsContent>

        {/* Tab 3: Projects */}
        <TabsContent value="projects" className="mt-4">
          <SurfaceCard>
            {client?.projects?.length > 0 ? (
              <DataTable
                columns={[
                  { id: "name", label: "الاسم" },
                  { id: "status", label: "الحالة" },
                  { id: "pm", label: "مدير المشروع" },
                  { id: "progress", label: "الإنجاز" },
                  { id: "startDate", label: "تاريخ البداية" },
                  { id: "endDate", label: "تاريخ النهاية" },
                ]}
                data={client.projects}
                isLoading={false}
                isError={false}
                emptyState={{ icon: FolderKanban, message: "لا توجد مشاريع", hint: "" }}
                renderCells={(p: any) => [
                  <td key="name" className="px-5 py-3 text-sm font-medium">{p.name}</td>,
                  <td key="status" className="px-5 py-3"><StatusBadge status={p.status} /></td>,
                  <td key="pm" className="px-5 py-3 text-sm text-portal-note-text">{p.pmName ?? "—"}</td>,
                  <td key="progress" className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full bg-secondary-500" style={{ width: `${p.completionPercentage ?? 0}%` }} />
                      </div>
                      <span className="text-xs text-portal-note-text">{p.completionPercentage ?? 0}%</span>
                    </div>
                  </td>,
                  <td key="startDate" className="px-5 py-3 text-sm text-portal-note-text">{formatDate(p.startDate)}</td>,
                  <td key="endDate" className="px-5 py-3 text-sm text-portal-note-text">{formatDate(p.endDate)}</td>,
                ]}
              />
            ) : (
              <EmptyState icon={FolderKanban} title="لا توجد مشاريع" hint="لم يتم إنشاء مشاريع لهذا العميل بعد" />
            )}
          </SurfaceCard>
        </TabsContent>

        {/* Tab 4: Invoices */}
        <TabsContent value="invoices" className="mt-4">
          <SurfaceCard>
            {client?.invoices?.length > 0 ? (
              <DataTable
                columns={[
                  { id: "number", label: "رقم الفاتورة" },
                  { id: "amount", label: "المبلغ" },
                  { id: "status", label: "الحالة" },
                  { id: "issueDate", label: "تاريخ الإصدار" },
                  { id: "dueDate", label: "تاريخ الاستحقاق" },
                ]}
                data={client.invoices}
                isLoading={false}
                isError={false}
                emptyState={{ icon: Receipt, message: "لا توجد فواتير", hint: "" }}
                renderCells={(inv: any) => [
                  <td key="number" className="px-5 py-3 text-sm font-medium">{inv.invoiceNumber ?? inv.number ?? "—"}</td>,
                  <td key="amount" className="px-5 py-3 text-sm">{formatCurrency(inv.amount ?? inv.totalAmount)}</td>,
                  <td key="status" className="px-5 py-3"><StatusBadge status={inv.status} /></td>,
                  <td key="issueDate" className="px-5 py-3 text-sm text-portal-note-text">{formatDate(inv.issueDate ?? inv.createdAt)}</td>,
                  <td key="dueDate" className="px-5 py-3 text-sm text-portal-note-text">{formatDate(inv.dueDate)}</td>,
                ]}
              />
            ) : (
              <EmptyState icon={Receipt} title="لا توجد فواتير" hint="لم يتم إصدار فواتير لهذا العميل بعد" />
            )}
          </SurfaceCard>
        </TabsContent>

        {/* Tab 5: Payments */}
        <TabsContent value="payments" className="mt-4">
          <SurfaceCard>
            {client?.payments?.length > 0 ? (
              <DataTable
                columns={[
                  { id: "amount", label: "المبلغ" },
                  { id: "method", label: "طريقة الدفع" },
                  { id: "status", label: "الحالة" },
                  { id: "date", label: "التاريخ" },
                ]}
                data={client.payments}
                isLoading={false}
                isError={false}
                emptyState={{ icon: CreditCard, message: "لا توجد مدفوعات", hint: "" }}
                renderCells={(pm: any) => [
                  <td key="amount" className="px-5 py-3 text-sm font-medium">{formatCurrency(pm.amount)}</td>,
                  <td key="method" className="px-5 py-3 text-sm text-portal-note-text">{pm.paymentMethod ?? pm.method ?? "—"}</td>,
                  <td key="status" className="px-5 py-3"><StatusBadge status={pm.status} /></td>,
                  <td key="date" className="px-5 py-3 text-sm text-portal-note-text">{formatDate(pm.createdAt ?? pm.date)}</td>,
                ]}
              />
            ) : (
              <EmptyState icon={CreditCard} title="لا توجد مدفوعات" hint="لم يتم تسجيل أي مدفوعات لهذا العميل بعد" />
            )}
          </SurfaceCard>
        </TabsContent>

        {/* Tab 6: Activity History */}
        <TabsContent value="activity" className="mt-4">
          <SurfaceCard title="سجل النشاط" icon={Activity}>
            {isHistoryLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 animate-pulse rounded bg-neutral-100" />
                      <div className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : historyData?.items?.length > 0 ? (
              <div className="space-y-0">
                {historyData.items.map((entry: any, idx: number) => {
                  const isLast = idx === historyData.items.length - 1;
                  return (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
                          <Activity className="h-4 w-4 text-portal-icon" />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-neutral-200 my-1" />}
                      </div>
                      <div className="pb-6">
                        <p className="text-sm font-medium text-natural-100">
                          {entry.eventType ?? entry.action}
                        </p>
                        {entry.description && (
                          <p className="text-sm text-neutral-300 mt-0.5">{entry.description}</p>
                        )}
                        <div className="flex gap-3 mt-1">
                          {entry.actorName && (
                            <p className="text-xs text-neutral-200">{entry.actorName}</p>
                          )}
                          <p className="text-xs text-neutral-200">
                            {formatRelativeTime(entry.occurredAt ?? entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Activity} title="لا توجد نشاطات" hint="لم يتم تسجيل أي نشاط لهذا العميل بعد" />
            )}
          </SurfaceCard>
        </TabsContent>

        {/* Tab 7: Portal */}
        <TabsContent value="portal" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SurfaceCard title="حالة البوابة" icon={Globe}>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">حالة الرمز</span>
                  <StatusBadge
                    status={client?.portalToken ? "ACTIVE" : "STOPPED"}
                    label={client?.portalToken ? "مفعل" : "غير مفعل"}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">آخر تسجيل دخول</span>
                  <span className="text-sm font-medium">
                    {client?.lastLoginAt ? formatRelativeTime(client.lastLoginAt) : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">إكمال التسجيل</span>
                  <StatusBadge
                    status={client?.intakeCompleted ? "COMPLETED" : "PENDING"}
                    label={client?.intakeCompleted ? "مكتمل" : "غير مكتمل"}
                  />
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard title="إعدادات البوابة" icon={ExternalLink}>
              <div className="space-y-4">
                {client?.portalToken ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-portal-divider bg-neutral-50 px-3 py-2">
                      <span className="text-sm text-portal-note-text truncate ml-2" dir="ltr">
                        {client.portalToken}
                      </span>
                      <ActionButton variant="ghost" size="sm" onClick={() => handleCopyToken(client.portalToken)}>
                        <Copy className="size-4" />
                      </ActionButton>
                    </div>
                    <ActionButton variant="outline" size="sm" onClick={handleRegenerateToken}>
                      <RefreshCw className="size-4 ml-1" />
                      تجديد الرمز
                    </ActionButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-portal-note-text">لم يتم تفعيل بوابة العميل بعد</p>
                    <ActionButton variant="primary" size="sm" onClick={handleRegenerateToken}>
                      تفعيل البوابة
                    </ActionButton>
                  </div>
                )}
              </div>
            </SurfaceCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
