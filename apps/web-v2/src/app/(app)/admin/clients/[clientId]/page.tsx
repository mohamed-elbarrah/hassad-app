import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClientDetailWorkspace } from "@/features/clients/components/client-detail-workspace";
import { getClientDetailById } from "@/features/clients/lib/client-detail";

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function generateMetadata({
  params,
}: ClientDetailPageProps): Promise<Metadata> {
  const { clientId } = await params;
  const client = getClientDetailById(clientId);

  return {
    title: client ? `${client.companyName} | Hassad` : "Client Detail | Hassad",
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params;
  const client = getClientDetailById(clientId);

  if (!client) {
    notFound();
  }

  return <ClientDetailWorkspace client={client} />;
}
