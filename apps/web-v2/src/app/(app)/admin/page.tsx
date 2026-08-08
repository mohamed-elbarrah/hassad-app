import type { Metadata } from "next";

import { AdminOverviewDashboard } from "@/features/admin-overview/components/admin-overview-dashboard";

export const metadata: Metadata = {
  title: "Admin Overview | Hassad",
};

export default function AdminOverviewPage() {
  return <AdminOverviewDashboard />;
}
