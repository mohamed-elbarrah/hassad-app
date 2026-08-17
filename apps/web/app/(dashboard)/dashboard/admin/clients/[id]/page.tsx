"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { useGetAdminClientByIdQuery } from "@/features/admin/adminClientsApi";
import { useGetAdminProposalsQuery } from "@/features/admin/adminProposalsApi";
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
  ClientProposalsTable,
  ClientRecordsTabs,
} from "@/components/client-detail/ClientDetailPattern";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: client, isLoading, isError } = useGetAdminClientByIdQuery(id);
  const { data: proposalData, isLoading: proposalsLoading } =
    useGetAdminProposalsQuery({ clientId: id, limit: 50 });

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
                <EmptyTitle>العميل غير موجود</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على بيانات هذا العميل.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/admin/clients">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى القائمة
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  const proposals = proposalData?.items ?? [];
  const badges = [
    client.intakeCompleted ? (
      <Badge key="intake" variant="secondary">
        الملف مكتمل
      </Badge>
    ) : null,
    client.source ? (
      <Badge key="source" variant="outline">
        {client.source}
      </Badge>
    ) : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" dir="rtl">
      <ClientPageHeader
        title="تفاصيل العميل"
        description="عرض إداري موحد يجمع ملف العميل والعمليات المرتبطة به في مكان واحد."
        companyName={client.companyName}
        backHref="/dashboard/admin/clients"
        backLabel="العملاء"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <ClientContextPanel
          client={client}
          profile={client.profile}
          mode="admin"
          badges={badges}
          stats={buildDefaultClientStats(client, "admin")}
        />

        <ClientRecordsTabs
          title="العمليات المرتبطة"
          description="تنقل سريع بين كل ما يرتبط بهذا العميل دون مغادرة بطاقة التفاصيل."
          defaultValue="projects"
          tabs={[
            {
              value: "projects",
              label: "المشاريع",
              count: client.counters.projects,
              content: (
                <ClientProjectsTable
                  projects={client.projects}
                  hrefBuilder={(projectId) => `/dashboard/admin/projects/${projectId}`}
                />
              ),
            },
            {
              value: "contracts",
              label: "العقود",
              count: client.counters.contracts,
              content: (
                <ClientContractsTable
                  contracts={client.contracts}
                  hrefBuilder={(contractId) => `/dashboard/admin/contracts/${contractId}`}
                />
              ),
            },
            {
              value: "invoices",
              label: "الفواتير",
              count: client.counters.invoices,
              content: <ClientInvoicesTable invoices={client.invoices} />,
            },
            {
              value: "proposals",
              label: "العروض",
              count: client.counters.proposals,
              content: (
                <ClientProposalsTable
                  proposals={proposals.map((proposal) => ({
                    id: proposal.id,
                    title: proposal.title,
                    status: proposal.status,
                    totalPrice: proposal.totalPrice,
                    creator: proposal.creator ?? null,
                    createdAt: proposal.createdAt,
                  }))}
                  loading={proposalsLoading}
                  hrefBuilder={(proposalId) => `/dashboard/admin/proposals/${proposalId}`}
                />
              ),
            },
            {
              value: "history",
              label: "سجل النشاط",
              count: client.historyLogs.length,
              content: <ClientHistoryTable history={client.historyLogs} />,
            },
          ]}
        />
      </div>
    </div>
  );
}
