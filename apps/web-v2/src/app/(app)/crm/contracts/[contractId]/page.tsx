import type { Metadata } from "next";

import { CrmContractDetailPageClient } from "./page-client";

type CrmContractDetailPageProps = {
  params: Promise<{
    contractId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "CRM Contract Detail | Hassad",
  };
}

export default async function CrmContractDetailPage({
  params,
}: CrmContractDetailPageProps) {
  const { contractId } = await params;
  return <CrmContractDetailPageClient contractId={contractId} />;
}
