"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileClock } from "lucide-react";
import { useGetAdminContractByIdQuery } from "@/features/admin/adminContractsApi";
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

export default function AdminContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: contract, isLoading, isError } = useGetAdminContractByIdQuery(id);

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
                <EmptyDescription>لم نتمكن من العثور على بيانات هذا العقد.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/admin/contracts">
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

  return (
    <ContractDetailView
      contract={contract}
      backHref="/dashboard/admin/contracts"
      backLabel="العودة إلى العقود"
      fileUrl={contract.filePath ? buildPortalFileUrl(contract.filePath) : null}
      billingArea={
        <ContractClientBillingArea
          services={(contract.servicesList as Array<{ name: string; price: number }>) ?? []}
          totalValue={contract.totalValue}
          invoices={contract.invoices}
          canPay={false}
        />
      }
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/admin/clients/${contract.clientId}`}>ملف العميل</Link>
          </Button>
          {contract.project ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/admin/projects/${contract.project.id}`}>المشروع</Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}
