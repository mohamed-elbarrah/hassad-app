import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContractDetailWorkspace } from "@/features/crm-contracts/components/contract-detail-workspace";
import { getContractDetailById } from "@/features/crm-contracts/lib/contract-detail";

type ContractDetailPageProps = {
  params: Promise<{
    contractId: string;
  }>;
};

export async function generateMetadata({
  params,
}: ContractDetailPageProps): Promise<Metadata> {
  const { contractId } = await params;
  const contract = getContractDetailById(contractId);

  return {
    title: contract ? `${contract.title} | Hassad` : "Contract Detail | Hassad",
  };
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { contractId } = await params;
  const contract = getContractDetailById(contractId);

  if (!contract) {
    notFound();
  }

  return <ContractDetailWorkspace contract={contract} />;
}
