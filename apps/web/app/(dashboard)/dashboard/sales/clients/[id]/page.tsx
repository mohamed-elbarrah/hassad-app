"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetClientByIdQuery,
  useGetClientProfileQuery,
} from "@/features/clients/clientsApi";
import { ClientInfoCard } from "@/components/dashboard/crm/ClientInfoCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, PlusCircle, Building2, Phone, Mail } from "lucide-react";
import { OverviewTab } from "./overview-tab";
import { ProjectsTab } from "./projects-tab";
import { FinanceTab } from "./finance-tab";
import { ActivityTab } from "./activity-tab";
import { ProfileEditTab } from "./profile-edit-tab";
import { NewRequestForClientModal } from "@/components/dashboard/crm/NewRequestForClientModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [newRequestOpen, setNewRequestOpen] = useState(false);

  const { data: client, isLoading, isError } = useGetClientByIdQuery(id);
  const { data: profile } = useGetClientProfileQuery(id);

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-8 w-48 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-96" />
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
            <div className="flex items-center gap-4 text-sm text-neutral-300 mt-1">
              {client.contactName && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {client.contactName}
                </span>
              )}
              {client.phoneWhatsapp && (
                <span className="flex items-center gap-1" dir="ltr">
                  <Phone className="h-3.5 w-3.5" />
                  {client.phoneWhatsapp}
                </span>
              )}
              {client.email && (
                <span className="flex items-center gap-1" dir="ltr">
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </span>
              )}
            </div>
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

      {/* Client Info Card */}
      <ClientInfoCard client={client} />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start gap-1 bg-transparent p-0 h-auto border-b rounded-none">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-4 py-2"
          >
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-4 py-2"
          >
            المشاريع
          </TabsTrigger>
          <TabsTrigger
            value="finance"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-4 py-2"
          >
            المالية
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-4 py-2"
          >
            النشاط
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-4 py-2"
          >
            الملف التعريفي
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab client={client} profile={profile ?? null} />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <ProjectsTab clientId={id} />
        </TabsContent>

        <TabsContent value="finance" className="mt-6">
          <FinanceTab clientId={id} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityTab client={client} />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfileEditTab clientId={id} profile={profile ?? null} />
        </TabsContent>
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
