import { Suspense } from "react";
import { DashboardChatWorkspace } from "@/components/chat/DashboardChatWorkspace";

export default function PmChatPage() {
  return (
    <Suspense fallback={null}>
      <DashboardChatWorkspace scope="pm" />
    </Suspense>
  );
}
