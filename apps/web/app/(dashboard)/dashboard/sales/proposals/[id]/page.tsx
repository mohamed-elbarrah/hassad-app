"use client";

import { use } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useGetSalesProposalDetailQuery } from "@/features/proposals/proposalsApi";
import {
  SalesProposalDetailLoading,
  SalesProposalDetailView,
} from "@/components/sales-proposal-detail/SalesProposalDetailPattern";
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
import { salesWorkflowErrorMessage } from "@/lib/i18n";

export default function SalesProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: proposal,
    isLoading,
    isError,
    error,
  } = useGetSalesProposalDetailQuery(id);

  if (isLoading) return <SalesProposalDetailLoading />;

  if (isError || !proposal) {
    const errorStatus =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "data" in error &&
      typeof error.data === "object" &&
      error.data !== null &&
      "error" in error.data &&
      typeof error.data.error === "object" &&
      error.data.error !== null &&
      "code" in error.data.error
        ? error.data.error.code
        : undefined;
    const isForbidden =
      errorStatus === 403 || errorCode === "PERMISSION_DENIED";

    return (
      <div dir="rtl" className="  ">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>
                  {isForbidden
                    ? "لا تملك صلاحية الوصول إلى هذا العرض"
                    : errorCode === "PROPOSAL_NOT_FOUND"
                      ? "العرض غير موجود"
                      : "تعذر تحميل العرض الفني"}
                </EmptyTitle>
                <EmptyDescription>
                  {salesWorkflowErrorMessage(error)}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/sales/proposals">
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
    <SalesProposalDetailView
      proposal={proposal}
      backHref="/dashboard/sales/proposals"
      backLabel="العودة إلى العروض"
      fileUrl={proposal.filePath ? buildPortalFileUrl(proposal.filePath) : null}
    />
  );
}
