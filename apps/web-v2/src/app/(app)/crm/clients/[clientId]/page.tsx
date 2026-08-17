import type { Metadata } from "next";

import { CrmClientDetailPageClient } from "./page-client";

type CrmClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "CRM Client Detail | Hassad",
  };
}

export default async function CrmClientDetailPage({
  params,
}: CrmClientDetailPageProps) {
  const { clientId } = await params;
  return <CrmClientDetailPageClient clientId={clientId} />;
}
