"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCheck, Copy, FileClock } from "lucide-react";
import { toast } from "sonner";
import { useGetContractByIdQuery } from "@/features/contracts/contractsApi";
import { ContractClientBillingArea, ContractDetailLoading, ContractDetailView } from "@/components/contract-detail/ContractDetailPattern";
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
import { buildPortalFileUrl } from "@/lib/portal-files";

export default function SalesContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: contract, isLoading, isError } = useGetContractByIdQuery(id);
  const [copied, setCopied] = useState(false);

  if (isLoading) return <ContractDetailLoading />;

  if (isError || !contract) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <FileClock />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>العقد غير موجود</EmptyTitle>
                <EmptyDescription>تعذر تحميل تفاصيل العقد.</EmptyDescription>
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
    if (!contract.shareLinkToken) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/contract/${contract.shareLinkToken}`);
      setCopied(true);
      toast.success("تم نسخ رابط التوقيع");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  }

  return (
    <ContractDetailView
      contract={contract}
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
          {contract.client ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/sales/clients/${contract.client.id}`}>ملف العميل</Link>
            </Button>
          ) : null}
          {contract.shareLinkToken ? (
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? <CheckCheck data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
              {copied ? "تم النسخ" : "نسخ رابط التوقيع"}
            </Button>
          ) : null}
        </>
      }
    />
  );
}
