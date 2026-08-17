import type { Metadata } from "next";

import { CrmOrderDetailPageClient } from "./page-client";

type CrmOrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "CRM Order Detail | Hassad",
  };
}

export default async function CrmOrderDetailPage({ params }: CrmOrderDetailPageProps) {
  const { orderId } = await params;
  return <CrmOrderDetailPageClient orderId={orderId} />;
}
