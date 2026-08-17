export type ChatConversationType =
  | "direct"
  | "group"
  | "project"
  | "comment-thread"
  | "dispute-thread";

export type ChatPresenceState = "online" | "away" | "offline" | "last_seen";

export type ChatConnectionState =
  | "connected"
  | "reconnecting"
  | "offline"
  | "error";

export type ChatMessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "seen"
  | "failed";

export type ChatAttachmentKind = "image" | "document" | "audio";

export type ChatMessageKind = "text" | "attachment" | "system";

export type ChatMessageAction =
  | "reply"
  | "react"
  | "edit"
  | "delete"
  | "pin"
  | "copy"
  | "download";

export type ChatScenarioId =
  | "direct-active"
  | "group-busy"
  | "project-thread"
  | "task-comment-thread"
  | "dispute-escalation-thread"
  | "empty-state"
  | "error-state"
  | "offline-state";

export type ChatAttachmentRecord = {
  id: string;
  kind: ChatAttachmentKind;
  name: string;
  description: string;
  orientation?: "horizontal" | "vertical";
  state?: "idle" | "uploading" | "processing" | "error" | "done";
};

export type ChatReactionRecord = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export type ChatParticipant = {
  id: string;
  name: string;
  initials: string;
  role: string;
  presence: ChatPresenceState;
  lastSeen: string;
};

export type ChatCapabilitySet = Record<ChatMessageAction, boolean> & {
  compose: boolean;
  attach: boolean;
  manageParticipants: boolean;
};

export type ChatMessageRecord = {
  id: string;
  kind: ChatMessageKind;
  authorId?: string;
  body: string;
  createdAt: string;
  status?: ChatMessageStatus;
  reactions: ChatReactionRecord[];
  attachments: ChatAttachmentRecord[];
  replyPreview?: string;
  editedLabel?: string;
  isPinned?: boolean;
};

export type ChatConversationRecord = {
  id: string;
  type: ChatConversationType;
  title: string;
  subtitle: string;
  preview: string;
  updatedAt: string;
  unreadCount: number;
  participants: ChatParticipant[];
  messages: ChatMessageRecord[];
  capabilitySet: ChatCapabilitySet;
  sharedFiles: ChatAttachmentRecord[];
  isMuted?: boolean;
  isPinned?: boolean;
  isLocked?: boolean;
  statusNote?: string;
};

export type ChatPreviewScenario = {
  id: ChatScenarioId;
  title: string;
  description: string;
  connection: ChatConnectionState;
  notice: string;
  conversations: ChatConversationRecord[];
  defaultConversationId: string | null;
  defaultDraft: string;
};
