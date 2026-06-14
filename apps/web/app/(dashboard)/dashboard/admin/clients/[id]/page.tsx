"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2 } from "lucide-react";
import { useGetClientByIdQuery } from "@/features/clients/clientsApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DashboardCard } from "@/components/design-system/DashboardCard";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ClientInfoCard } from "@/components/dashboard/crm/ClientInfoCard";
import { ClientTimeline } from "@/components/dashboard/crm/ClientTimeline";
import { RequirementsForm } from "@/components/dashboard/crm/RequirementsForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminClientDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: client, isLoading, isError } = useGetClientByIdQuery(id);

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-[30px]" />
            <Skeleton className="h-64 rounded-[30px]" />
          </div>
          <Skeleton className="h-96 rounded-[30px]" />
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="text-center space-y-4 pt-12" dir="rtl">
        <p className="text-base text-portal-note-text">لم يتم العثور على العميل</p>
        <ActionButton variant="outline" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 mr-1" />رجوع
        </ActionButton>
      </div>
    );
  }

  type ClientWithActivities = typeof client & {
    activities?: Array<{ id: string; action: string; details?: string | null; createdAt: string; userId: string }>;
  };
  const clientWithActivities = client as ClientWithActivities;

  return (
    <div className="space-y-6" dir="rtl">
      <PageIntro
        title={client.companyName}
        description="تفاصيل العميل وسجل النشاطات"
        icon={Building2}
        actions={
          <ActionButton variant="ghost" size="md" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4 mr-1" />رجوع
          </ActionButton>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ClientInfoCard client={client} />
          <RequirementsForm client={client} />
        </div>
        <div>
          <ClientTimeline activities={clientWithActivities.activities ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DashboardCard title="المشاريع" icon={Building2} showAll={false}>
          <p className="text-base text-portal-note-text">قائمة المشاريع الخاصة بالعميل ستظهر هنا.</p>
        </DashboardCard>
        <DashboardCard title="الفواتير" icon={Building2} showAll={false}>
          <p className="text-base text-portal-note-text">الفواتير والمدفوعات قيد الإضافة.</p>
        </DashboardCard>
        <DashboardCard title="المحادثات" icon={Building2} showAll={false}>
          <p className="text-base text-portal-note-text">سجل المحادثات سيظهر هنا.</p>
        </DashboardCard>
        <DashboardCard title="العقود" icon={Building2} showAll={false}>
          <p className="text-base text-portal-note-text">تفاصيل العقود سيتم إظهارها عند اكتمال الربط.</p>
        </DashboardCard>
      </div>
    </div>
  );
}
