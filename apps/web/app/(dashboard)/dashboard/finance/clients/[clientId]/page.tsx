"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { useGetClientByIdQuery, useGetClientProfileQuery } from "@/features/clients/clientsApi";
import { useGetContractsQuery } from "@/features/contracts/contractsApi";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import {
  buildDefaultClientStats,
  ClientContextPanel,
  ClientContractsTable,
  ClientDetailLoading,
  ClientHistoryTable,
  ClientInvoicesTable,
  ClientPageHeader,
  ClientPaymentsTable,
  ClientRecordsTabs,
} from "@/components/client-detail/ClientDetailPattern";
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

export default function ClientFinanceDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const {
    data: client,
    isLoading: clientLoading,
    isError: clientError,
  } = useGetClientByIdQuery(clientId);
  const { data: profile, isLoading: profileLoading } =
    useGetClientProfileQuery(clientId);
  const { data: contractsData, isLoading: contractsLoading } =
    useGetContractsQuery({ clientId });
  const { data: invoicesData, isLoading: invoicesLoading } =
    useGetInvoicesQuery({ clientId });

  if (clientLoading || profileLoading) {
    return <ClientDetailLoading />;
  }

  if (clientError || !client) {
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
                  تعذر تحميل الملف المالي لهذا العميل.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/finance/clients">
                    <ArrowLeft data-icon="inline-start" />
                    العودة لقائمة العملاء
                  </Link>
                </Button>
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
        title="الوضع المالي للعميل"
        description="نفس نمط العميل الموحد لكن مع تركيز أوضح على الفواتير والعقود والتحصيل."
        companyName={client.companyName}
        backHref="/dashboard/finance/clients"
        backLabel="عملاء المالية"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <ClientContextPanel
          client={detailClient}
          profile={profile ?? null}
          mode="finance"
          stats={buildDefaultClientStats(detailClient, "finance")}
        />

        <ClientRecordsTabs
          title="العمليات المرتبطة"
          description="مراجعة العقود والفواتير والدفعات وسجل العميل من نفس بطاقة التفاصيل."
          defaultValue="invoices"
          tabs={[
            {
              value: "invoices",
              label: "الفواتير",
              count: invoicesData?.total ?? 0,
              content: invoicesLoading ? (
                <TabLoadingState />
              ) : (
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
                  hrefBuilder={(invoiceId) => `/dashboard/finance/invoices/${invoiceId}`}
                />
              ),
            },
            {
              value: "payments",
              label: "الدفعات",
              count: payments.length,
              content: invoicesLoading ? (
                <TabLoadingState />
              ) : (
                <ClientPaymentsTable payments={payments} />
              ),
            },
            {
              value: "contracts",
              label: "العقود",
              count: contractsData?.total ?? 0,
              content: contractsLoading ? (
                <TabLoadingState />
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
                  hrefBuilder={(contractId) => `/dashboard/finance/contracts/${contractId}`}
                />
              ),
            },
            {
              value: "history",
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
          ]}
        />
      </div>
    </div>
  );
}
