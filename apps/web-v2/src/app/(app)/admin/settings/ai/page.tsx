import type { Metadata } from "next";
import { AdminSettingsWorkspace } from "@/features/admin-settings/components/admin-settings-workspace";

export const metadata: Metadata = { title: "AI settings | Hassad" };

export default function AdminAiSettingsPage() {
  return <AdminSettingsWorkspace mode="ai" />;
}
