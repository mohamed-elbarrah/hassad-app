"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowRight, TrendingUp } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { DataTable } from "@/components/design-system/DataTable";
import { useGetAdminLeadQuery } from "@/features/admin/adminApi";

const STAGE_MAP: Record<string, string> = { NEW: "جديد", QUALIFIED: "مؤهل", PROPOSAL: "عرض", NEGOTIATION: "تفاوض", CLOSED: "مغلق" };

export default function AdminLeadDetailPage() {
  const params = useParams(); const router = useRouter(); const id = params.id as string;
  const { data: lead, isLoading } = useGetAdminLeadQuery(id);

  if (isLoading) return <div className="flex flex-col gap-6 p-6" dir="rtl"><Skeleton className="h-8 w-48 rounded-lg" /><Skeleton className="h-96 w-full rounded-2xl" /></div>;
  if (!lead) return <div className="p-6 text-center text-portal-note-text" dir="rtl">العميل المحتمل غير موجود</div>;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title={lead.companyName} description={lead.contactName} icon={TrendingUp}
        actions={<ActionButton variant="outline" size="md" onClick={() => router.back()}><ArrowRight className="size-4 ml-1" />العودة</ActionButton>} />

      <SurfaceCard>
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="w-full justify-start gap-1 px-4 pt-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="contact">سجل التواصل</TabsTrigger>
            <TabsTrigger value="pipeline">سجل المراحل</TabsTrigger>
            <TabsTrigger value="services">الخدمات</TabsTrigger>
            <TabsTrigger value="automation">سجل الأتمتة</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><span className="text-sm text-portal-note-text">اسم الشركة</span><p className="text-base font-medium">{lead.companyName}</p></div>
                  <div><span className="text-sm text-portal-note-text">جهة الاتصال</span><p className="text-base font-medium">{lead.contactName}</p></div>
                  <div><span className="text-sm text-portal-note-text">البريد</span><p className="text-base font-medium">{lead.email ?? "—"}</p></div>
                  <div><span className="text-sm text-portal-note-text">الهاتف</span><p className="text-base font-medium">{lead.phoneWhatsapp ?? "—"}</p></div>
                </div>
                <div className="space-y-4">
                  <div><span className="text-sm text-portal-note-text">المسؤول</span><p className="text-base font-medium">{lead.assignee?.name ?? "—"}</p></div>
                  <div><span className="text-sm text-portal-note-text">المرحلة</span><Pill tone="blue">{STAGE_MAP[lead.pipelineStage] ?? lead.pipelineStage}</Pill></div>
                  <div><span className="text-sm text-portal-note-text">المصدر</span><p className="text-base font-medium">{lead.source ?? "—"}</p></div>
                  <div><span className="text-sm text-portal-note-text">نوع النشاط</span><p className="text-base font-medium">{lead.businessType ?? "—"}</p></div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="contact">
              <DataTable columns={[{ id: "type", label: "النوع" }, { id: "result", label: "النتيجة" }, { id: "notes", label: "ملاحظات" }, { id: "date", label: "التاريخ", align: "left" }]}
                data={lead.contactLogs ?? []} isLoading={false} isError={false}
                emptyState={{ icon: TrendingUp, message: "لا توجد سجلات تواصل", hint: "لم يتم تسجيل أي تواصل مع هذا العميل المحتمل" }}
                renderRow={(c: any) => (
                  <tr key={c.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{c.type}</td>
                    <td className="px-5 py-3 text-sm">{c.result}</td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">{c.notes ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">{c.contactedAt?.slice(0, 10) ?? "—"}</td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="pipeline">
              <DataTable columns={[{ id: "from", label: "من" }, { id: "to", label: "إلى" }, { id: "by", label: "بواسطة" }, { id: "date", label: "التاريخ", align: "left" }]}
                data={lead.pipelineHistory ?? []} isLoading={false} isError={false}
                emptyState={{ icon: TrendingUp, message: "لا يوجد سجل مراحل", hint: "لم يتم تسجيل تغييرات في المراحل" }}
                renderRow={(h: any) => (
                  <tr key={h.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm"><Pill tone="neutral">{h.fromStage}</Pill></td>
                    <td className="px-5 py-3 text-sm"><Pill tone="blue">{h.toStage}</Pill></td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">{h.changedBy ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">{h.changedAt?.slice(0, 10) ?? "—"}</td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="services">
              <DataTable columns={[{ id: "service", label: "الخدمة" }, { id: "qty", label: "الكمية" }, { id: "price", label: "السعر" }]}
                data={lead.services ?? []} isLoading={false} isError={false}
                emptyState={{ icon: TrendingUp, message: "لا توجد خدمات", hint: "لم يتم إضافة خدمات لهذا العميل المحتمل" }}
                renderRow={(s: any) => (
                  <tr key={s.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{s.service?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-sm">{s.quantity ?? 1}</td>
                    <td className="px-5 py-3 text-sm">{s.price ?? "—"}</td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="automation">
              <DataTable columns={[{ id: "rule", label: "القاعدة" }, { id: "status", label: "الحالة" }, { id: "date", label: "التاريخ", align: "left" }]}
                data={lead.automationLogs ?? []} isLoading={false} isError={false}
                emptyState={{ icon: TrendingUp, message: "لا توجد سجلات أتمتة", hint: "لم يتم تشغيل أي قواعد أتمتة لهذا العميل المحتمل" }}
                renderRow={(a: any) => (
                  <tr key={a.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{a.ruleId}</td>
                    <td className="px-5 py-3 text-sm"><Pill tone={a.status === "SUCCESS" ? "success" : "danger"}>{a.status}</Pill></td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">{a.executedAt?.slice(0, 10) ?? "—"}</td>
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
