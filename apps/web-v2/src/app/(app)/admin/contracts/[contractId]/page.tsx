import type { Metadata } from "next";
import { ContractDetailPageClient } from "./page-client";

type ContractDetailPageProps = {
  params: Promise<{
    contractId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contract Detail | Hassad",
  };
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { contractId } = await params;
  return <ContractDetailPageClient contractId={contractId} />;
}
