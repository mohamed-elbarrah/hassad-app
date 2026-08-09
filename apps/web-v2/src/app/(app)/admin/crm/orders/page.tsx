import type { Metadata } from "next";

import { OrdersWorkspace } from "@/features/crm-orders/components/orders-workspace";

export const metadata: Metadata = {
  title: "Orders | Hassad",
};

export default function OrdersPage() {
  return <OrdersWorkspace />;
}
