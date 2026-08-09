import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProposalDetailWorkspace } from "@/features/crm-proposals/components/proposal-detail-workspace";
import { getProposalDetailById } from "@/features/crm-proposals/lib/proposal-detail";

type ProposalDetailPageProps = {
  params: Promise<{
    proposalId: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProposalDetailPageProps): Promise<Metadata> {
  const { proposalId } = await params;
  const proposal = getProposalDetailById(proposalId);

  return {
    title: proposal ? `${proposal.title} | Hassad` : "Proposal Detail | Hassad",
  };
}

export default async function ProposalDetailPage({
  params,
}: ProposalDetailPageProps) {
  const { proposalId } = await params;
  const proposal = getProposalDetailById(proposalId);

  if (!proposal) {
    notFound();
  }

  return <ProposalDetailWorkspace proposal={proposal} />;
}
