import type { Metadata } from "next";

import { CrmChatWorkspace } from "@/features/chat/components/crm-chat-workspace";
import { requireServerSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "CRM Chat | Hassad",
};

export default async function CrmChatPage() {
  const session = await requireServerSession();

  return <CrmChatWorkspace currentUserId={session.id} />;
}
