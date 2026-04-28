"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useGetClientByIdQuery } from "@/features/clients/clientsApi";
import { ClientInfoCard } from "@/components/dashboard/crm/ClientInfoCard";
import { ClientTimeline } from "@/components/dashboard/crm/ClientTimeline";
import { RequirementsForm } from "@/components/dashboard/crm/RequirementsForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientDetailPage({ params }: PageProps) {
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
    </div>
  );
}
