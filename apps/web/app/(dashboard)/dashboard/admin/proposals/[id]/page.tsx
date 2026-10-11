"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { useGetAdminProposalByIdQuery, useGetAdminProposalActorCapabilitiesQuery, useConvertAdminProposalToContractMutation } from "@/features/admin/adminProposalsApi";
import { useLazyGetAdminClientByIdQuery } from "@/features/admin/adminClientsApi";
import { AdminClientInfoPanel } from "@/components/client-detail/AdminClientInfoPanel";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
import { ErrorState } from "@/components/design-system/EmptyState";
import {
  ProposalDetailLoading,
  ProposalDetailView,
} from "@/components/proposal-detail/ProposalDetailPattern";
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

export default function AdminProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currentData: proposal, isLoading, isError, error, refetch } = useGetAdminProposalByIdQuery(id);
  const [loadClient, clientQuery] = useLazyGetAdminClientByIdQuery();
  const clientId = proposal?.client?.id;
  const clientDetail = clientQuery.currentData;
  const hasCurrentClient = Boolean(clientId && clientDetail?.id === clientId);
  const isClientQueryError =
    clientQuery.isError && clientQuery.originalArgs === clientId;
  const {
    data: capabilities,
    error: capabilitiesError,
    isError: isCapabilitiesError,
    refetch: refetchCapabilities,
  } = useGetAdminProposalActorCapabilitiesQuery();
  const [convert, { isLoading: isConverting, error: convertError, data: convertResult }] = useConvertAdminProposalToContractMutation();
  const canIntervene = capabilities?.canIntervene === true;

  if (isLoading) return <ProposalDetailLoading />;

  if (isError || !proposal) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>العرض غير موجود</EmptyTitle>
                <EmptyDescription>
                  {adminErrorMessage(error)}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={() => refetch()}>إعادة المحاولة</Button>
                  <Button asChild>
                    <Link href="/dashboard/admin/proposals">
                    <ArrowLeft data-icon="inline-start" />
                      العودة إلى عروض الأسعار
                    </Link>
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <ProposalDetailView
        key={proposal.id}
        proposal={proposal}
        backHref="/dashboard/admin/proposals"
        backLabel="العودة إلى عروض الأسعار"
        showClientTab
        clientTabContent={
          <AdminClientInfoPanel
            clientId={clientId}
            client={hasCurrentClient ? clientDetail : undefined}
            isLoading={
              clientQuery.isFetching ||
              Boolean(clientId && !hasCurrentClient && !isClientQueryError)
            }
            error={isClientQueryError ? clientQuery.error : undefined}
            onRetry={() => {
              if (clientId) loadClient(clientId);
            }}
          />
        }
        onClientTabSelect={() => {
          if (
            clientId &&
            !hasCurrentClient &&
            !clientQuery.isFetching &&
            !isClientQueryError
          ) {
            loadClient(clientId);
          }
        }}
        actions={canIntervene && proposal.status === "APPROVED" && !proposal.contract ? <Button onClick={() => convert(id)} disabled={isConverting}>{isConverting ? "جارٍ التحويل..." : "تحويل إلى عقد"}</Button> : null}
        relatedAction={
          <div className="flex flex-col gap-2">
            {isCapabilitiesError ? (
              <ErrorState
                title="تعذّر تحميل صلاحيات الإدارة"
                message={adminErrorMessage(capabilitiesError)}
                onRetry={() => refetchCapabilities()}
              />
            ) : null}
            {convertError ? <p role="alert" className="text-sm text-destructive">{adminErrorMessage(convertError)}</p> : null}
            {convertResult ? <p role="status" className="text-sm text-success-600">{adminSuccessMessage(convertResult.code)}</p> : null}
            <div className="flex flex-wrap gap-2">
            {proposal.client ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/admin/clients/${proposal.client.id}`}>
                  ملف العميل
                </Link>
              </Button>
            ) : null}
            {proposal.request ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/admin/requests/${proposal.request.id}`}>
                  الطلب المرتبط
                </Link>
              </Button>
            ) : null}
            {proposal.contract ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/admin/contracts/${proposal.contract.id}`}>
                  العقد الناتج
                </Link>
              </Button>
            ) : null}
            </div>
          </div>
        }
      />
    </div>
  );
}
