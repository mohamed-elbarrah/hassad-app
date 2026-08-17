import type { Metadata } from "next";
import { ClientDetailPageClient } from "./page-client";

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Client Detail | Hassad",
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params;
  return <ClientDetailPageClient clientId={clientId} />;
}
