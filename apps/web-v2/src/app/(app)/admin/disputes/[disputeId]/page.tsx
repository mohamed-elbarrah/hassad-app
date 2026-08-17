import type { Metadata } from "next";
import { DisputeDetailPageClient } from "./page-client";

type DisputeDetailPageProps = {
  params: Promise<{
    disputeId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Dispute Detail | Hassad",
  };
}

export default async function DisputeDetailPage({
  params,
}: DisputeDetailPageProps) {
  const { disputeId } = await params;
  return <DisputeDetailPageClient disputeId={disputeId} />;
}
