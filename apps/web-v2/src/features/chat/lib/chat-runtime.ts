import { formatDistanceToNowStrict } from "date-fns";

export type ChatUserPresence = "online" | "last_seen";

export type ChatParticipantRecord = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

export type ChatAttachmentRecord = {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  uploadedAt: string | null;
  url: string | null;
};

export type ChatMessageRecord = {
  id: string;
  conversationId: string;
  content: string;
  displayContent: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  sender: ChatParticipantRecord;
  deletedBy: { id: string; name: string } | null;
  attachments: ChatAttachmentRecord[];
  replyTo: {
    id: string;
    content: string;
    senderName: string;
  } | null;
};

export type ChatConversationRecord = {
  id: string;
  type: "DIRECT" | "GROUP" | "PROJECT";
  title: string | null;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
  clientId: string | null;
  clientName: string | null;
  project: { id: string; name: string } | null;
  participants: ChatParticipantRecord[];
  messageCount?: number;
  lastMessage?: ChatMessageRecord | null;
};

export type ChatTargetOption = {
  userId: string;
  name: string;
  subtitle: string;
  kind: "employee" | "client";
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

export function buildInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function resolvePresence(lastLoginAt: string | null): {
  state: ChatUserPresence;
  label: string;
} {
  if (!lastLoginAt) {
    return { state: "last_seen", label: "No recent activity" };
  }

  const lastSeenDate = new Date(lastLoginAt);
  if (Number.isNaN(lastSeenDate.getTime())) {
    return { state: "last_seen", label: "Recent activity unavailable" };
  }

  const diffMinutes = Math.abs(Date.now() - lastSeenDate.getTime()) / 60000;
  if (diffMinutes <= 5) {
    return { state: "online", label: "Online" };
  }

  return {
    state: "last_seen",
    label: `Last seen ${formatDistanceToNowStrict(lastSeenDate, { addSuffix: true })}`,
  };
}

export function getConversationPeer(
  conversation: ChatConversationRecord,
  currentUserId: string,
) {
  return (
    conversation.participants.find((participant) => participant.id !== currentUserId) ??
    conversation.participants[0] ??
    null
  );
}

export function getConversationTitle(
  conversation: ChatConversationRecord,
  currentUserId: string,
) {
  if (conversation.type === "DIRECT") {
    return getConversationPeer(conversation, currentUserId)?.name ?? "Direct chat";
  }

  return conversation.title ?? conversation.project?.name ?? "Group chat";
}

export function getConversationSubtitle(
  conversation: ChatConversationRecord,
  currentUserId: string,
) {
  if (conversation.type === "DIRECT") {
    const peer = getConversationPeer(conversation, currentUserId);
    if (!peer) return "Direct conversation";
    return resolvePresence(peer.lastLoginAt).label;
  }

  if (conversation.project?.name) {
    return conversation.project.name;
  }

  return `${conversation.participants.length} participants`;
}
