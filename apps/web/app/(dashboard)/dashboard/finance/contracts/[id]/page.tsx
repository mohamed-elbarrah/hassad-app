"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileClock } from "lucide-react";
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

export default function FinanceContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: contract, isLoading, isError } = useGetContractByIdQuery(id);

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
                <EmptyDescription>تعذر تحميل بيانات العقد المالي.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/finance/contracts">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى العقود المالية
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ContractDetailView
      contract={contract}
      backHref="/dashboard/finance/contracts"
      backLabel="العودة إلى العقود المالية"
      fileUrl={contract.filePath ? buildPortalFileUrl(contract.filePath) : null}
      billingArea={
        <ContractClientBillingArea
          services={contract.servicesList ?? []}
          totalValue={contract.totalValue}
          invoices={contract.invoices ?? []}
          canPay={false}
        />
      }
    />
  );
}
