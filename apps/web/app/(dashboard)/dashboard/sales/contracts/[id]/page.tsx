"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCheck, Copy, FileClock } from "lucide-react";
import { ContractStatus } from "@hassad/shared";
import { toast } from "sonner";
import {
  useGetSalesContractDetailQuery,
  useLazyGetSalesContractShareLinkQuery,
} from "@/features/contracts/contractsApi";
import {
  ContractClientBillingArea,
  ContractDetailLoading,
  ContractDetailView,
} from "@/components/contract-detail/ContractDetailPattern";
import { Button } from "@/components/ui/button";
import { SalesClientInfoPanel } from "@/components/client-detail/SalesClientInfoPanel";
import { SalesContractSendAction } from "@/components/dashboard/sales/SalesContractSendAction";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { buildPortalFileUrl } from "@/lib/portal-files";
import { salesWorkflowErrorMessage } from "@/lib/i18n";

export default function SalesContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    currentData: contract,
    error,
    isLoading,
    isError,
  } = useGetSalesContractDetailQuery(id);
  const [copied, setCopied] = useState(false);
  const [clientTabEnabled, setClientTabEnabled] = useState(false);
  const [getShareLink, { isFetching: isShareLinkFetching }] =
    useLazyGetSalesContractShareLinkQuery();

  if (isLoading) return <ContractDetailLoading />;

  if (isError || !contract) {
    return (
      <div dir="rtl" className="  ">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <FileClock />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>العقد غير موجود</EmptyTitle>
                <EmptyDescription>
                  {salesWorkflowErrorMessage(error)}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/sales/contracts">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى العقود
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleCopyLink() {
    try {
      const result = await getShareLink(id).unwrap();
      await navigator.clipboard.writeText(
        `${window.location.origin}${result.path}`,
      );
      setCopied(true);
      toast.success("تم نسخ رابط التوقيع");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (shareLinkError) {
      toast.error(salesWorkflowErrorMessage(shareLinkError));
    }
  }

  return (
    <ContractDetailView
      key={contract.id}
      contract={contract}
      showClientTab
      clientTabContent={
        clientTabEnabled ? (
          <SalesClientInfoPanel
            clientId={contract.clientId}
            active={clientTabEnabled}
          />
        ) : null
      }
      onClientTabSelect={() => setClientTabEnabled(true)}
      backHref="/dashboard/sales/contracts"
      backLabel="العودة إلى العقود"
      fileUrl={contract.filePath ? buildPortalFileUrl(contract.filePath) : null}
      billingArea={
        <ContractClientBillingArea
          services={contract.servicesList ?? []}
          totalValue={contract.totalValue}
          invoices={contract.invoices ?? []}
          canPay={false}
        />
      }
      actions={
        <>
          {contract.status === ContractStatus.DRAFT ? (
            <SalesContractSendAction
              contractId={contract.id}
              variant="default"
            />
          ) : null}
          {contract.client ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/sales/clients/${contract.client.id}`}>
                ملف العميل
              </Link>
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            disabled={isShareLinkFetching}
          >
            {copied ? (
              <CheckCheck data-icon="inline-start" />
            ) : (
              <Copy data-icon="inline-start" />
            )}
            {copied
              ? "تم النسخ"
              : isShareLinkFetching
                ? "جاري التحميل"
                : "نسخ رابط التوقيع"}
          </Button>
        </>
      }
    />
  );
}
