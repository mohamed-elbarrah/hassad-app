import type { Metadata } from "next";

import { CrmProposalDetailPageClient } from "./page-client";

type CrmProposalDetailPageProps = {
  params: Promise<{
    proposalId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "CRM Proposal Detail | Hassad",
  };
}

export default async function CrmProposalDetailPage({
  params,
}: CrmProposalDetailPageProps) {
  const { proposalId } = await params;
  return <CrmProposalDetailPageClient proposalId={proposalId} />;
}
