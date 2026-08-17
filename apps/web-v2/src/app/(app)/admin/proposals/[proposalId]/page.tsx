import type { Metadata } from "next";
import { ProposalDetailPageClient } from "./page-client";

type ProposalDetailPageProps = {
  params: Promise<{
    proposalId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Proposal Detail | Hassad",
  };
}

export default async function ProposalDetailPage({
  params,
}: ProposalDetailPageProps) {
  const { proposalId } = await params;
  return <ProposalDetailPageClient proposalId={proposalId} />;
}
