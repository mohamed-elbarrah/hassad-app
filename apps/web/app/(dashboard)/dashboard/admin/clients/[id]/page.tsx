"use client";

import { useParams, useRouter } from "next/navigation";
import { Building2, ArrowRight, User, FileSignature, Briefcase, FileText, DollarSign, Activity } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import { KpiPill } from "@/components/design-system/KpiPill";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { DataTable } from "@/components/design-system/DataTable";
import {
  useGetAdminClientQuery,
  useGetAdminContractsQuery,
  useGetAdminProjectsQuery,
} from "@/features/admin/adminApi";
import { CONTRACT_STATUS_AR, PROJECT_STATUS_AR, CLIENT_STATUS_AR } from "@hassad/shared";

export default function AdminClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: client, isLoading } = useGetAdminClientQuery(id);
  const { data: contracts } = useGetAdminContractsQuery({ clientId: id, limit: 50 });
  const { data: projects } = useGetAdminProjectsQuery({ clientId: id, limit: 50 });

  if (isLoading)
    return (
      <div className="flex flex-col gap-6 p-6" dir="rtl">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  if (!client)
    return (
      <div className="p-6 text-center text-portal-note-text" dir="rtl">
        العميل غير موجود
      </div>
    );

  const displayName = client.companyName ?? client.name ?? "—";
  const email = client.email ?? "—";
  const counters = client.counters ?? {};

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={displayName}
        description={email}
        icon={Building2}
        actions={
          <ActionButton variant="outline" size="md" onClick={() => router.back()}>
            <ArrowRight className="size-4 ml-1" />
            العودة
          </ActionButton>
        }
      />

      {/* KPI counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiPill label="العقود" value={counters.contracts ?? 0} />
        <KpiPill label="المشاريع" value={counters.projects ?? 0} />
        <KpiPill label="الفواتير" value={counters.invoices ?? 0} />
        <KpiPill label="المدفوعات" value={counters.payments ?? 0} />
        <KpiPill label="العروض" value={counters.proposals ?? 0} />
        <KpiPill label="الطلبات" value={counters.requests ?? 0} />
      </div>

      <SurfaceCard>
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="w-full justify-start gap-1 px-4 pt-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="contracts">العقود</TabsTrigger>
            <TabsTrigger value="projects">المشاريع</TabsTrigger>
            <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">اسم الشركة</span>
                    <p className="text-base font-medium">{client.companyName ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">الاسم التجاري</span>
                    <p className="text-base font-medium">{client.businessName ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">نوع النشاط</span>
                    <p className="text-base font-medium">{client.businessType ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">جهة الاتصال</span>
                    <p className="text-base font-medium">{client.contactName ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">البريد الإلكتروني</span>
                    <p className="text-base font-medium">{email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">رقم الجوال</span>
                    <p className="text-base font-medium">{client.phone ?? "—"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">الحالة</span>
                    <div className="mt-1">
                      <StatusBadge
                        status={client.status ?? (client.isActive ? "ACTIVE" : "INACTIVE")}
                        label={CLIENT_STATUS_AR?.[client.status] ?? (client.isActive ? "نشط" : "غير نشط")}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">مدير الحساب</span>
                    <p className="text-base font-medium">{client.manager?.name ?? "—"}</p>
                  </div>
                  {client.avgSatisfactionScore != null && (
                    <div>
                      <span className="text-sm text-portal-note-text">معدل الرضا</span>
                      <p className="text-base font-medium">
                        {Math.round(client.avgSatisfactionScore * 20)}%
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-portal-note-text">إجمالي العقود</span>
                    <p className="text-base font-medium">
                      {client.totalContractValue?.toLocaleString() ?? 0} ر.س
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">إجمالي الفواتير</span>
                    <p className="text-base font-medium">
                      {client.totalInvoiced?.toLocaleString() ?? 0} ر.س
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">إجمالي المدفوعات</span>
                    <p className="text-base font-medium">
                      {client.totalPaid?.toLocaleString() ?? 0} ر.س
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">بوابة العميل</span>
                    <p className="text-base font-medium">
                      {client.portalAccess ? "مفعلة" : "غير مفعلة"}
                    </p>
                  </div>
                  {client.intakeCompleted != null && (
                    <div>
                      <span className="text-sm text-portal-note-text">استكمال البيانات</span>
                      <p className="text-base font-medium">
                        {client.intakeCompleted ? "مكتمل" : "غير مكتمل"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="contracts">
              <DataTable
                columns={[
                  { id: "title", label: "العقد" },
                  { id: "status", label: "الحالة" },
                  { id: "totalValue", label: "القيمة" },
                  { id: "endDate", label: "تاريخ الانتهاء", align: "left" },
                ]}
                data={contracts?.items ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: FileSignature,
                  message: "لا توجد عقود",
                  hint: "لم يتم إضافة عقود لهذا العميل",
                }}
                renderRow={(c: any) => (
                  <tr
                    key={c.id}
                    className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
                    onClick={() => router.push(`/dashboard/admin/contracts/${c.id}`)}
                  >
                    <td className="px-5 py-3 text-sm font-medium">{c.title}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} label={CONTRACT_STATUS_AR[c.status] ?? c.status} />
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {c.totalValue?.toLocaleString()} ر.س
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {c.endDate?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="projects">
              <DataTable
                columns={[
                  { id: "name", label: "المشروع" },
                  { id: "status", label: "الحالة" },
                  { id: "pmName", label: "مدير المشروع" },
                  { id: "createdAt", label: "تاريخ الإنشاء", align: "left" },
                ]}
                data={projects?.items ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: Briefcase,
                  message: "لا توجد مشاريع",
                  hint: "لم يتم إضافة مشاريع لهذا العميل",
                }}
                renderRow={(p: any) => (
                  <tr
                    key={p.id}
                    className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
                    onClick={() => router.push(`/dashboard/admin/projects/${p.id}`)}
                  >
                    <td className="px-5 py-3 text-sm font-medium">{p.name}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} label={PROJECT_STATUS_AR[p.status] ?? p.status} />
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">
                      {p.pmName ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {p.createdAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="invoices">
              <DataTable
                columns={[
                  { id: "number", label: "الرقم" },
                  { id: "amount", label: "المبلغ" },
                  { id: "status", label: "الحالة" },
                  { id: "dueDate", label: "تاريخ الاستحقاق", align: "left" },
                ]}
                data={client.invoices ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: FileText,
                  message: "لا توجد فواتير",
                  hint: "لم يتم إنشاء فواتير لهذا العميل",
                }}
                renderRow={(inv: any) => (
                  <tr key={inv.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3 text-sm">{inv.amount?.toLocaleString()} ر.س</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inv.status} label={inv.status} />
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {inv.dueDate?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
          </div>
        </Tabs>
      </SurfaceCard>
    </div>
  );
}
