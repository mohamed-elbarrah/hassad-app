import { AiAssistantWidget } from "@/components/admin-ai/AiAssistantWidget";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AiAssistantWidget />
    </>
  );
}
