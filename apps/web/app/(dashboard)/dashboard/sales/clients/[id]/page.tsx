"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetClientByIdQuery,
  useGetClientProfileQuery,
} from "@/features/clients/clientsApi";
import { useAppSelector } from "@/lib/hooks";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { PlusCircle } from "lucide-react";
import { OverviewTab } from "./overview-tab";
import { ProjectsTab } from "./projects-tab";
import { FinanceTab } from "./finance-tab";
import { ActivityTab } from "./activity-tab";
import { NewRequestForClientModal } from "@/components/dashboard/crm/NewRequestForClientModal";
import { formatRelativeTime } from "@/lib/format";
import { getVisibleTabs } from "./tab-visibility";
import { SalesDetailBreadcrumb } from "@/components/dashboard/sales/shared/SalesDetailBreadcrumb";
import { SalesDetailError } from "@/components/dashboard/sales/shared/SalesDetailError";
import { SalesDetailSkeleton } from "@/components/dashboard/sales/shared/SalesDetailSkeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientProfilePage({ params }: PageProps) {
  const { id } = use(params);
  void useRouter();
  const [newRequestOpen, setNewRequestOpen] = useState(false);

  const {
    data: client,
    isLoading,
    isError,
    refetch,
  } = useGetClientByIdQuery(id);
  const { data: profile } = useGetClientProfileQuery(id);
  const { user } = useAppSelector((state) => state.auth);

  const visibleTabs = user
    ? getVisibleTabs(user.role)
    : getVisibleTabs("ADMIN" as any);
  const defaultTab = visibleTabs[0]?.value ?? "overview";

  if (isLoading) {
    return <SalesDetailSkeleton variant="client" />;
  }

  if (isError || !client) {
    return (
      <SalesDetailError
        title="لم يتم العثور على العميل"
        onRetry={refetch}
        backHref="/dashboard/sales/clients"
        backLabel="العملاء"
      />
    );
  }

  return (
    <div className="page-shell" dir="rtl">
      <SalesDetailBreadcrumb
        backHref="/dashboard/sales/clients"
        backLabel="العملاء"
        title={client.companyName}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-natural-100 truncate">
            {client.companyName}
          </h1>
          <p className="text-sm text-portal-note-text mt-0.5">
            آخر تحديث: {formatRelativeTime(String(client.updatedAt))}
          </p>
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
