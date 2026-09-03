import type { ReactNode } from "react";
import { AiAssistantWidget } from "@/components/admin-ai/AiAssistantWidget";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <AiAssistantWidget />
    </>
  );
}
