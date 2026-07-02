"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetClientByIdQuery,
  useGetClientProfileQuery,
} from "@/features/clients/clientsApi";
import { useAppSelector } from "@/lib/hooks";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { ArrowRight, PlusCircle } from "lucide-react";
import { OverviewTab } from "./overview-tab";
import { ProjectsTab } from "./projects-tab";
import { FinanceTab } from "./finance-tab";
import { ActivityTab } from "./activity-tab";
import { NewRequestForClientModal } from "@/components/dashboard/crm/NewRequestForClientModal";
import { formatRelativeTime } from "@/lib/format";
import { getVisibleTabs } from "./tab-visibility";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [newRequestOpen, setNewRequestOpen] = useState(false);

  const { data: client, isLoading, isError } = useGetClientByIdQuery(id);
  const { data: profile } = useGetClientProfileQuery(id);
  const { user } = useAppSelector((state) => state.auth);

  const visibleTabs = user ? getVisibleTabs(user.role) : getVisibleTabs("ADMIN" as any);
  const defaultTab = visibleTabs[0]?.value ?? "overview";

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-8 w-48 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 xl:col-span-3">
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <div className="lg:col-span-8 xl:col-span-9 space-y-5">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="text-center space-y-4 pt-12" dir="rtl">
        <p className="text-neutral-300">لم يتم العثور على العميل</p>
        <ActionButton variant="outline" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 me-2" />
          رجوع
        </ActionButton>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            رجوع
          </ActionButton>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold truncate">
              {client.companyName}
            </h1>
            <p className="text-sm text-neutral-300 mt-0.5">
              آخر تحديث: {formatRelativeTime(String(client.updatedAt))}
            </p>
          </div>
        </div>

        <ActionButton
          variant="primary"
          size="sm"
          onClick={() => setNewRequestOpen(true)}
          icon={<PlusCircle className="h-4 w-4" />}
        >
          طلب جديد
        </ActionButton>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} dir="rtl">
        <TabsList>
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {visibleTabs.some((t) => t.value === "overview") && (
          <TabsContent value="overview">
            <OverviewTab client={client} profile={profile ?? null} />
          </TabsContent>
        )}

        {visibleTabs.some((t) => t.value === "projects") && (
          <TabsContent value="projects">
            <ProjectsTab clientId={id} />
          </TabsContent>
        )}

        {visibleTabs.some((t) => t.value === "finance") && (
          <TabsContent value="finance">
            <FinanceTab clientId={id} />
          </TabsContent>
        )}

        {visibleTabs.some((t) => t.value === "activity") && (
          <TabsContent value="activity">
            <ActivityTab client={client} />
          </TabsContent>
        )}
      </Tabs>

      {/* New Request Modal */}
      <NewRequestForClientModal
        client={client}
        open={newRequestOpen}
        onClose={() => setNewRequestOpen(false)}
      />
    </div>
  );
}
