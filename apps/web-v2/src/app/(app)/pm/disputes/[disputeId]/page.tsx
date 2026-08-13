import type { Metadata } from "next";

import { PmDisputeDetailPageClient } from "./page-client";

type PmDisputeDetailPageProps = {
  params: Promise<{
    disputeId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "PM Dispute Detail | Hassad",
  };
}

export default async function PmDisputeDetailPage({ params }: PmDisputeDetailPageProps) {
  const { disputeId } = await params;
  return <PmDisputeDetailPageClient disputeId={disputeId} />;
}
