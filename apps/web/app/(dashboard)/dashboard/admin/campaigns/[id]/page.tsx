"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowRight, BarChart3 } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { DataTable } from "@/components/design-system/DataTable";
import { useGetAdminCampaignQuery } from "@/features/admin/adminApi";

const STATUS_MAP: Record<string, string> = { PLANNING: "تخطيط", ACTIVE: "نشط", PAUSED: "متوقف", ENDED: "منتهي" };

export default function AdminCampaignDetailPage() {
  const params = useParams(); const router = useRouter(); const id = params.id as string;
  const { data: campaign, isLoading } = useGetAdminCampaignQuery(id);

  if (isLoading) return <div className="flex flex-col gap-6 p-6" dir="rtl"><Skeleton className="h-8 w-48 rounded-lg" /><Skeleton className="h-96 w-full rounded-2xl" /></div>;
  if (!campaign) return <div className="p-6 text-center text-portal-note-text" dir="rtl">الحملة غير موجودة</div>;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title={campaign.name} description={`${campaign.client?.companyName ?? "—"} · ${STATUS_MAP[campaign.status] ?? campaign.status}`} icon={BarChart3}
        actions={<ActionButton variant="outline" size="md" onClick={() => router.back()}><ArrowRight className="size-4 ml-1" />العودة</ActionButton>} />

      <SurfaceCard>
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="w-full justify-start gap-1 px-4 pt-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="kpis">مؤشرات الأداء</TabsTrigger>
            <TabsTrigger value="history">سجل الحالة</TabsTrigger>
            <TabsTrigger value="connections">اتصالات المنصات</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><span className="text-sm text-portal-note-text">العميل</span><p className="text-base font-medium">{campaign.client?.companyName ?? "—"}</p></div>
                  <div><span className="text-sm text-portal-note-text">المسؤول</span><p className="text-base font-medium">{campaign.manager?.name ?? "—"}</p></div>
                  <div><span className="text-sm text-portal-note-text">المنصة</span><p className="text-base font-medium">{campaign.platform ?? "—"}</p></div>
                  <div><span className="text-sm text-portal-note-text">الحالة</span><div className="mt-1"><StatusBadge status={campaign.status} label={STATUS_MAP[campaign.status] ?? campaign.status} /></div></div>
                </div>
                <div className="space-y-4">
                  <div><span className="text-sm text-portal-note-text">الميزانية</span><p className="text-base font-medium">{campaign.budgetTotal?.toLocaleString()}</p></div>
                  <div><span className="text-sm text-portal-note-text">المصروف</span><p className="text-base font-medium">{campaign.budgetSpent?.toLocaleString()}</p></div>
                  <div><span className="text-sm text-portal-note-text">تجاوز الميزانية</span><p className="text-base font-medium">{Number(campaign.budgetSpent) > Number(campaign.budgetTotal) ? <Pill tone="danger">تجاوز</Pill> : "لا"}</p></div>
                  <div><span className="text-sm text-portal-note-text">تاريخ البداية - النهاية</span><p className="text-base font-medium">{campaign.startDate?.slice(0, 10) ?? "—"} → {campaign.endDate?.slice(0, 10) ?? "—"}</p></div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="kpis">
              <DataTable columns={[{ id: "date", label: "التاريخ", align: "left" }, { id: "impressions", label: "مرات الظهور" }, { id: "clicks", label: "نقرات" }, { id: "conversions", label: "تحويلات" }, { id: "revenue", label: "إيرادات" }, { id: "ctr", label: "CTR" }, { id: "cpa", label: "CPA" }]}
                data={campaign.kpiSnapshots ?? []} isLoading={false} isError={false}
                emptyState={{ icon: BarChart3, message: "لا توجد مؤشرات أداء", hint: "لم يتم تسجيل مؤشرات أداء لهذه الحملة بعد" }}
                renderRow={(k: any) => (
                  <tr key={k.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">{k.recordedAt?.slice(0, 10) ?? "—"}</td>
                    <td className="px-5 py-3 text-sm">{k.impressions ?? 0}</td>
                    <td className="px-5 py-3 text-sm">{k.clicks ?? 0}</td>
                    <td className="px-5 py-3 text-sm">{k.conversions ?? 0}</td>
                    <td className="px-5 py-3 text-sm">{k.revenue ?? 0}</td>
                    <td className="px-5 py-3 text-sm">{k.ctr ? `${k.ctr}%` : "—"}</td>
                    <td className="px-5 py-3 text-sm">{k.cpa ?? "—"}</td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="history">
              <DataTable columns={[{ id: "from", label: "من" }, { id: "to", label: "إلى" }, { id: "by", label: "بواسطة" }, { id: "date", label: "التاريخ", align: "left" }]}
                data={campaign.statusHistory ?? []} isLoading={false} isError={false}
                emptyState={{ icon: BarChart3, message: "لا يوجد سجل", hint: "لم يتم تسجيل تغييرات في الحالة" }}
                renderRow={(h: any) => (
                  <tr key={h.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm"><StatusBadge status={h.fromStatus} label={h.fromStatus} /></td>
                    <td className="px-5 py-3 text-sm"><StatusBadge status={h.toStatus} label={h.toStatus} /></td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">{h.changedBy ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">{h.createdAt?.slice(0, 10) ?? "—"}</td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="connections">
              <DataTable columns={[{ id: "platform", label: "المنصة" }, { id: "status", label: "الحالة" }, { id: "lastSync", label: "آخر مزامنة", align: "left" }]}
                data={campaign.platformConnections ?? []} isLoading={false} isError={false}
                emptyState={{ icon: BarChart3, message: "لا توجد اتصالات", hint: "لم يتم ربط هذه الحملة بأي منصة إعلانية" }}
                renderRow={(c: any) => (
                  <tr key={c.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{c.platform}</td>
                    <td className="px-5 py-3 text-sm"><Pill tone={c.syncStatus === "SYNCED" ? "success" : "warning"}>{c.syncStatus}</Pill></td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">{c.lastSyncedAt?.slice(0, 10) ?? "—"}</td>
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
