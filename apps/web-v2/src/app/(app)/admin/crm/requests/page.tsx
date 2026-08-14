import type { Metadata } from "next";

import { OrdersWorkspace } from "@/features/crm-orders/components/orders-workspace";

export const metadata: Metadata = {
  title: "Requests | Hassad",
};

export default function RequestsPage() {
  return <OrdersWorkspace />;
}
