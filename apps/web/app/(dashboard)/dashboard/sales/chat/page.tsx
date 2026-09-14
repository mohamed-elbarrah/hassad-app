import { Suspense } from "react";
import { DashboardChatWorkspace } from "@/components/chat/DashboardChatWorkspace";

export default function SalesChatPage() {
  return (
    <Suspense fallback={null}>
      <DashboardChatWorkspace scope="sales" />
    </Suspense>
  );
}
