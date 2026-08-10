import type { Metadata } from "next";

import { PmChatWorkspace } from "@/features/chat/components/pm-chat-workspace";
import { requireServerSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "PM Chat | Hassad",
};

export default async function PmChatPage() {
  const session = await requireServerSession();

  return <PmChatWorkspace currentUserId={session.id} />;
}
