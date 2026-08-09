import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DisputeDetailWorkspace } from "@/features/disputes/components/dispute-detail-workspace";
import { getDisputeDetailById } from "@/features/disputes/lib/dispute-detail";

type DisputeDetailPageProps = {
  params: Promise<{
    disputeId: string;
  }>;
};

export async function generateMetadata({
  params,
}: DisputeDetailPageProps): Promise<Metadata> {
  const { disputeId } = await params;
  const dispute = getDisputeDetailById(disputeId);

  return {
    title: dispute ? `${dispute.ticketNumber} | Hassad` : "Dispute Detail | Hassad",
  };
}

export default async function DisputeDetailPage({
  params,
}: DisputeDetailPageProps) {
  const { disputeId } = await params;
  const dispute = getDisputeDetailById(disputeId);

  if (!dispute) {
    notFound();
  }

  return <DisputeDetailWorkspace dispute={dispute} />;
}
