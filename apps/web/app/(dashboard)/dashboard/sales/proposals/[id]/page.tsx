"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useGetProposalByIdQuery } from "@/features/proposals/proposalsApi";
import { ProposalDetailLoading, ProposalDetailView } from "@/components/proposal-detail/ProposalDetailPattern";
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

export default function SalesProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: proposal, isLoading, isError } = useGetProposalByIdQuery(id);

  if (isLoading) return <ProposalDetailLoading />;

  if (isError || !proposal) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>العرض غير موجود</EmptyTitle>
                <EmptyDescription>تعذر تحميل تفاصيل العرض الفني.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/sales/proposals">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى العروض
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
      backHref="/dashboard/sales/proposals"
      backLabel="العودة إلى العروض"
      fileUrl={proposal.filePath ? buildPortalFileUrl(proposal.filePath) : null}
      relatedAction={
        <div className="flex flex-wrap gap-2">
          {proposal.request ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/sales/requests/${proposal.request.id}`}>الطلب المرتبط</Link>
            </Button>
          ) : null}
          {proposal.client ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/sales/clients/${proposal.client.id}`}>ملف العميل</Link>
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
