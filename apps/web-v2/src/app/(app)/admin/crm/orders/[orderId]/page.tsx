import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderDetailWorkspace } from "@/features/crm-orders/components/order-detail-workspace";
import { getOrderDetailById } from "@/features/crm-orders/lib/order-detail";

type OrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { orderId } = await params;
  const order = getOrderDetailById(orderId);

  return {
    title: order ? `${order.companyName} | Hassad` : "Order Detail | Hassad",
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  const order = getOrderDetailById(orderId);

  if (!order) {
    notFound();
  }

  return <OrderDetailWorkspace order={order} />;
}
