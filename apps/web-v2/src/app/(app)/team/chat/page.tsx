import type { Metadata } from "next";

import { TeamChatWorkspace } from "@/features/chat/components/team-chat-workspace";
import { requireServerSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Team Chat | Hassad",
};

export default async function TeamChatPage() {
  const session = await requireServerSession();

  return <TeamChatWorkspace currentUserId={session.id} />;
}
