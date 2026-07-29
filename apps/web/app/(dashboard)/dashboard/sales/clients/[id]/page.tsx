"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Pencil, PlusCircle } from "lucide-react";
import {
  useGetClientByIdQuery,
  useGetClientProfileQuery,
} from "@/features/clients/clientsApi";
import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { useGetContractsQuery } from "@/features/contracts/contractsApi";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { NewRequestForClientModal } from "@/components/dashboard/crm/NewRequestForClientModal";
import { ProfileEditTab } from "./profile-edit-tab";
import {
  buildDefaultClientStats,
  ClientContextPanel,
  ClientContractsTable,
  ClientDetailLoading,
  ClientHistoryTable,
  ClientInvoicesTable,
  ClientPageHeader,
  ClientPaymentsTable,
  ClientProjectsTable,
  ClientRecordsTabs,
} from "@/components/client-detail/ClientDetailPattern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

function TabLoadingState() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

function PermissionState({ title }: { title: string }) {
  return (
    <Empty className="border bg-muted/30 p-10">
      <EmptyMedia variant="icon">
        <Building2 />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>الوصول غير متاح</EmptyTitle>
        <EmptyDescription>{title}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const {
    data: client,
    isLoading,
    isError,
    refetch,
  } = useGetClientByIdQuery(id);
  const { data: profile } = useGetClientProfileQuery(id);
  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectsQueryError,
  } = useGetProjectsQuery({ clientId: id });
  const {
    data: contractsData,
    isLoading: contractsLoading,
    isError: contractsError,
    error: contractsQueryError,
  } = useGetContractsQuery({ clientId: id });
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    isError: invoicesError,
    error: invoicesQueryError,
  } = useGetInvoicesQuery({ clientId: id });

  if (isLoading) {
    return <ClientDetailLoading />;
  }

  if (isError || !client) {
    return (
      <div className="p-4 sm:p-6 lg:p-8" dir="rtl">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>لم يتم العثور على العميل</EmptyTitle>
                <EmptyDescription>
                  تعذر تحميل بيانات هذا العميل الآن.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/sales/clients">
                      <ArrowLeft data-icon="inline-start" />
                      العودة للعملاء
                    </Link>
                  </Button>
                  <Button onClick={() => refetch()}>إعادة المحاولة</Button>
                </div>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  const detailClient = {
    ...client,
    profile: profile ?? null,
    hasPortalAccess: Boolean(client.portalAccessToken),
  };
  const projectPermissionDenied =
    projectsError && (projectsQueryError as { status?: number })?.status === 403;
  const contractPermissionDenied =
    contractsError && (contractsQueryError as { status?: number })?.status === 403;
  const invoicePermissionDenied =
    invoicesError && (invoicesQueryError as { status?: number })?.status === 403;
  const payments = (invoicesData?.items ?? []).flatMap((invoice) =>
    (invoice.payments ?? []).map((payment: any) => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method ?? "—",
      status: payment.status ?? "—",
      createdAt: String(payment.createdAt ?? payment.date ?? invoice.createdAt),
      invoiceNumber: invoice.invoiceNumber,
    })),
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" dir="rtl">
      <ClientPageHeader
        title="تفاصيل العميل"
        description="عرض موحد لفريق المبيعات يربط الملف التعريفي بالحركة التجارية والمالية."
        companyName={client.companyName}
        backHref="/dashboard/sales/clients"
        backLabel="العملاء"
        actions={
          <Button size="sm" onClick={() => setNewRequestOpen(true)}>
            <PlusCircle data-icon="inline-start" />
            طلب جديد
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <ClientContextPanel
          client={detailClient}
          profile={profile ?? null}
          mode="sales"
          stats={buildDefaultClientStats(detailClient, "sales")}
          profileActions={
            isEditingProfile ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)}>
                العودة للعرض
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                <Pencil data-icon="inline-start" />
                تعديل الملف
              </Button>
            )
          }
          profileContent={
            isEditingProfile ? (
              <Card>
                <CardHeader className="gap-2">
                  <CardTitle>تعديل ملف العميل</CardTitle>
                  <CardDescription>
                    حدّث بيانات النشاط الحالية ثم احفظ التغييرات من نفس البطاقة.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileEditTab clientId={client.id} profile={profile ?? null} />
                </CardContent>
              </Card>
            ) : undefined
          }
        />

        <ClientRecordsTabs
          title="العمليات المرتبطة"
          description="كل ما يحتاجه فريق المبيعات معزول داخل نفس البطاقة وبحسب الصلاحية."
          defaultValue="projects"
          tabs={[
            {
              value: "projects",
              label: "المشاريع",
              count: projectsData?.total ?? client.totalProjects ?? 0,
              content: projectsLoading ? (
                <TabLoadingState />
              ) : projectPermissionDenied ? (
                <PermissionState title="ليس لديك صلاحية لعرض المشاريع المرتبطة بهذا العميل." />
              ) : (
                <ClientProjectsTable
                  projects={(projectsData?.items ?? []).map((project) => ({
                    id: project.id,
                    name: project.name,
                    status: project.status,
                    completionPercentage: project.completionPercentage ?? 0,
                    manager: project.manager ?? null,
                    startDate: project.startDate ? String(project.startDate) : null,
                    endDate: project.endDate ? String(project.endDate) : null,
                    createdAt: String(project.createdAt),
                  }))}
                />
              ),
            },
            {
              value: "contracts",
              label: "العقود",
              count: contractsData?.total ?? 0,
              content: contractsLoading ? (
                <TabLoadingState />
              ) : contractPermissionDenied ? (
                <PermissionState title="ليس لديك صلاحية لعرض العقود المرتبطة بهذا العميل." />
              ) : (
                <ClientContractsTable
                  contracts={(contractsData?.items ?? []).map((contract) => ({
                    id: contract.id,
                    title: contract.title,
                    status: contract.status,
                    totalValue: contract.totalValue,
                    startDate: contract.startDate ? String(contract.startDate) : null,
                    endDate: contract.endDate ? String(contract.endDate) : null,
                    createdAt: String(contract.createdAt),
                  }))}
                  hrefBuilder={(contractId) => `/dashboard/sales/contracts/${contractId}`}
                />
              ),
            },
            {
              value: "invoices",
              label: "الفواتير",
              count: invoicesData?.total ?? 0,
              content: invoicesLoading ? (
                <TabLoadingState />
              ) : invoicePermissionDenied ? (
                <PermissionState title="ليس لديك صلاحية لعرض السجل المالي لهذا العميل." />
              ) : (
                <div className="flex flex-col gap-4">
                  <ClientInvoicesTable
                    invoices={(invoicesData?.items ?? []).map((invoice) => ({
                      id: invoice.id,
                      invoiceNumber: invoice.invoiceNumber,
                      amount: invoice.amount,
                      remainingAmount:
                        invoice.amount -
                        (invoice.payments ?? []).reduce(
                          (total: number, payment: any) => total + (payment.amount ?? 0),
                          0,
                      ),
                      status: invoice.status,
                      dueDate: invoice.dueDate ? String(invoice.dueDate) : null,
                      issueDate: invoice.issueDate ? String(invoice.issueDate) : null,
                      createdAt: String(invoice.createdAt),
                    }))}
                  />
                </div>
              ),
            },
            {
              value: "activity",
              label: "سجل النشاط",
              count: client.historyLogs?.length ?? 0,
              content: (
                <ClientHistoryTable
                  history={(client.historyLogs ?? []).map((item) => ({
                    id: item.id,
                    eventType: item.eventType,
                    description: item.description,
                    userName: item.user?.name ?? null,
                    occurredAt: String(item.occurredAt),
                  }))}
                />
              ),
            },
            {
              value: "payments",
              label: "الدفعات",
              count: payments.length,
              content: invoicesLoading ? (
                <TabLoadingState />
              ) : invoicePermissionDenied ? (
                <PermissionState title="ليس لديك صلاحية لعرض الدفعات المسجلة لهذا العميل." />
              ) : (
                <ClientPaymentsTable payments={payments} />
              ),
            },
          ]}
        />
      </div>

      <NewRequestForClientModal
        client={client}
        open={newRequestOpen}
        onClose={() => setNewRequestOpen(false)}
      />
    </div>
  );
}
