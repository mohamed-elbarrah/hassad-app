import type { Metadata } from "next";

import { AdminChatWorkspace } from "@/features/chat/components/admin-chat-workspace";
import { requireServerSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Chat | Hassad",
};

export default async function AdminChatPage() {
  const session = await requireServerSession();

  return <AdminChatWorkspace currentUserId={session.id} />;
}
