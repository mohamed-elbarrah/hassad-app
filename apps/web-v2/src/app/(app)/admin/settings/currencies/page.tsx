import type { Metadata } from "next";
import { AdminSettingsWorkspace } from "@/features/admin-settings/components/admin-settings-workspace";

export const metadata: Metadata = { title: "Currency settings | Hassad" };

export default function AdminCurrencySettingsPage() {
  return <AdminSettingsWorkspace mode="currencies" />;
}
