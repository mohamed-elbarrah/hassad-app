import type { Metadata } from "next";
import { AdminSettingsWorkspace } from "@/features/admin-settings/components/admin-settings-workspace";

export const metadata: Metadata = { title: "Payment settings | Hassad" };

export default function AdminPaymentSettingsPage() {
  return <AdminSettingsWorkspace mode="payments" />;
}
