import { Suspense } from "react";
import { DashboardChatWorkspace } from "@/components/chat/DashboardChatWorkspace";

export default function AdminChatPage() {
  return (
    <Suspense fallback={null}>
      <DashboardChatWorkspace scope="admin" />
    </Suspense>
  );
}
