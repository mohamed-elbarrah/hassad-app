"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useGetClientByIdQuery } from "@/features/clients/clientsApi";
import { ClientInfoCard } from "@/components/dashboard/crm/ClientInfoCard";
import { ClientTimeline } from "@/components/dashboard/crm/ClientTimeline";
import { RequirementsForm } from "@/components/dashboard/crm/RequirementsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="text-center space-y-4 pt-12" dir="rtl">
        <p className="text-muted-foreground">لم يتم العثور على العميل</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 me-2" />
          رجوع
        </Button>
      </div>
    );
  }

  type ClientWithActivities = typeof client & {
    activities?: Array<{
      id: string;
      action: string;
      details?: string | null;
      createdAt: string;
      userId: string;
    }>;
  };

  const clientWithActivities = client as ClientWithActivities;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>
        <h1 className="text-2xl font-semibold">{client.companyName}</h1>
      </div>

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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المشاريع</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            قائمة المشاريع الخاصة بالعميل ستظهر هنا.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الفواتير</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            الفواتير والمدفوعات قيد الإضافة.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المحادثات</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            سجل المحادثات سيظهر هنا.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">العقود</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            تفاصيل العقود سيتم إظهارها عند اكتمال الربط.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
