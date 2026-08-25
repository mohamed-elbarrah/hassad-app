"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useGetAdminProposalByIdQuery } from "@/features/admin/adminProposalsApi";
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
  const {
    data: proposal,
    isLoading,
    isError,
  } = useGetAdminProposalByIdQuery(id);

  if (isLoading) return <ProposalDetailLoading />;

  if (isError || !proposal) {
    return (
      <div dir="rtl" className="  ">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>العرض غير موجود</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على بيانات هذا العرض.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/admin/proposals">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى عروض الأسعار
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
    <ProposalDetailView
      proposal={proposal}
      backHref="/dashboard/admin/proposals"
      backLabel="العودة إلى عروض الأسعار"
      relatedAction={
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
      }
    />
  );
}
