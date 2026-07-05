"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowRight, FileSignature, DollarSign } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { DataTable } from "@/components/design-system/DataTable";
import { useGetAdminContractQuery } from "@/features/admin/adminApi";
import { CONTRACT_STATUS_AR } from "@hassad/shared";

export default function AdminContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: contract, isLoading } = useGetAdminContractQuery(id);

  if (isLoading)
    return (
      <div className="flex flex-col gap-6 p-6" dir="rtl">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  if (!contract)
    return (
      <div className="p-6 text-center text-portal-note-text" dir="rtl">
        العقد غير موجود
      </div>
    );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={contract.title}
        description={`${contract.client?.companyName ?? "—"} · ${CONTRACT_STATUS_AR[contract.status] ?? contract.status}`}
        icon={FileSignature}
        actions={
          <ActionButton
            variant="outline"
            size="md"
            onClick={() => router.back()}
          >
            <ArrowRight className="size-4 ml-1" />
            العودة
          </ActionButton>
        }
      />

      <SurfaceCard>
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="w-full justify-start gap-1 px-4 pt-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="plans">خطة الدفع</TabsTrigger>
            <TabsTrigger value="versions">الإصدارات</TabsTrigger>
            <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
            <TabsTrigger value="history">سجل الحالة</TabsTrigger>
            <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">
                      العميل
                    </span>
                    <p className="text-base font-medium">
                      {contract.client?.companyName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">النوع</span>
                    <p className="text-base font-medium">{contract.type}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      الحالة
                    </span>
                    <div className="mt-1">
                      <StatusBadge
                        status={contract.status}
                        label={
                          CONTRACT_STATUS_AR[contract.status] ?? contract.status
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">
                      القيمة الشهرية
                    </span>
                    <p className="text-base font-medium">
                      {contract.monthlyValue?.toLocaleString()}{" "}
                      {contract.currency}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      القيمة الإجمالية
                    </span>
                    <p className="text-base font-medium">
                      {contract.totalValue?.toLocaleString()}{" "}
                      {contract.currency}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      التوقيع الإلكتروني
                    </span>
                    <p className="text-base font-medium">
                      {contract.eSigned ? "موقّع" : "غير موقّع"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="plans">
              <DataTable
                columns={[
                  { id: "label", label: "الاسم" },
                  { id: "amount", label: "المبلغ" },
                  { id: "type", label: "النوع" },
                ]}
                data={contract.paymentPlans ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: FileSignature,
                  message: "لا توجد خطط دفع",
                  hint: "لم يتم إضافة خطط دفع لهذا العقد",
                }}
                renderRow={(p: any) => (
                  <tr key={p.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{p.label}</td>
                    <td className="px-5 py-3 text-sm">
                      {p.amountValue?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm">{p.amountType}</td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="versions">
              <DataTable
                columns={[
                  { id: "version", label: "الإصدار" },
                  { id: "createdAt", label: "تاريخ الإنشاء", align: "left" },
                ]}
                data={contract.versions ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: FileSignature,
                  message: "لا توجد إصدارات",
                  hint: "لم يتم إنشاء إصدارات لهذا العقد",
                }}
                renderRow={(v: any) => (
                  <tr key={v.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">
                      الإصدار {v.versionNumber}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {v.createdAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="alerts">
              <DataTable
                columns={[
                  { id: "type", label: "النوع" },
                  { id: "scheduledAt", label: "مجدول في", align: "left" },
                  { id: "sent", label: "تم الإرسال" },
                ]}
                data={contract.renewalAlerts ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: FileSignature,
                  message: "لا توجد تنبيهات",
                  hint: "لم يتم إنشاء تنبيهات تجديد لهذا العقد",
                }}
                renderRow={(a: any) => (
                  <tr key={a.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">
                      {a.alertType}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {a.scheduledAt?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {a.isSent ? "نعم" : "لا"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="history">
              <DataTable
                columns={[
                  { id: "from", label: "من" },
                  { id: "to", label: "إلى" },
                  { id: "at", label: "التاريخ", align: "left" },
                ]}
                data={contract.statusHistory ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: FileSignature,
                  message: "لا يوجد سجل",
                  hint: "لم يتم تسجيل تغييرات في الحالة",
                }}
                renderRow={(h: any) => (
                  <tr key={h.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm">
                      <StatusBadge status={h.fromStatus} label={h.fromStatus} />
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <StatusBadge status={h.toStatus} label={h.toStatus} />
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {h.changedAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="invoices">
              <DataTable
                columns={[
                  { id: "amount", label: "المبلغ" },
                  { id: "status", label: "الحالة" },
                  { id: "date", label: "التاريخ", align: "left" },
                ]}
                data={contract.invoices ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: DollarSign,
                  message: "لا توجد فواتير",
                  hint: "لم يتم إنشاء فواتير لهذا العقد بعد",
                }}
                renderRow={(inv: any) => (
                  <tr key={inv.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">
                      {inv.amount?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inv.status} label={inv.status} />
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {inv.createdAt?.slice(0, 10) ?? "—"}
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
