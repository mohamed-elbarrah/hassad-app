import type { Metadata } from "next";
import { OrderDetailPageClient } from "./page-client";

type OrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Order Detail | Hassad",
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  return <OrderDetailPageClient orderId={orderId} />;
}
