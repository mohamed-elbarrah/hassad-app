import type { Metadata } from "next";

import { MarketingChatWorkspace } from "@/features/chat/components/marketing-chat-workspace";
import { requireServerSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Marketing Chat | Hassad",
};

export default async function MarketingChatPage() {
  const session = await requireServerSession();

  return <MarketingChatWorkspace currentUserId={session.id} />;
}
