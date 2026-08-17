import type {
  ChatAttachmentRecord,
  ChatConversationRecord,
  ChatPreviewScenario,
  ChatReactionRecord,
  ChatScenarioId,
} from "@/features/chat/lib/chat-types";

function reactions(items: Array<[string, number, boolean]>): ChatReactionRecord[] {
  return items.map(([emoji, count, reacted]) => ({ emoji, count, reacted }));
}

function file(
  id: string,
  name: string,
  description: string,
  kind: ChatAttachmentRecord["kind"] = "document",
  orientation: ChatAttachmentRecord["orientation"] = "horizontal",
  state: ChatAttachmentRecord["state"] = "done"
): ChatAttachmentRecord {
  return { id, name, description, kind, orientation, state };
}

const me = {
  id: "user-admin",
  name: "Maha Hasan",
  initials: "MH",
  role: "Admin",
  presence: "online",
  lastSeen: "Online now",
} as const;

const amir = {
  id: "user-amir",
  name: "Amir Nasser",
  initials: "AN",
  role: "Project manager",
  presence: "online",
  lastSeen: "Online now",
} as const;

const lina = {
  id: "user-lina",
  name: "Lina Salem",
  initials: "LS",
  role: "Design lead",
  presence: "away",
  lastSeen: "8m ago",
} as const;

const yara = {
  id: "user-yara",
  name: "Yara Adel",
  initials: "YA",
  role: "Marketing",
  presence: "last_seen",
  lastSeen: "Today, 09:20",
} as const;

const omar = {
  id: "user-omar",
  name: "Omar Khaled",
  initials: "OK",
  role: "Developer",
  presence: "offline",
  lastSeen: "Yesterday, 18:42",
} as const;

const hana = {
  id: "user-hana",
  name: "Hana Mostafa",
  initials: "HM",
  role: "Client success",
  presence: "online",
  lastSeen: "Online now",
} as const;

const rami = {
  id: "user-rami",
  name: "Rami Fawzi",
  initials: "RF",
  role: "Client",
  presence: "last_seen",
  lastSeen: "2h ago",
} as const;

const fullCapabilities = {
  compose: true,
  attach: true,
  reply: true,
  react: true,
  edit: true,
  delete: true,
  pin: true,
  copy: true,
  download: true,
  manageParticipants: true,
} as const;

const limitedCommentCapabilities = {
  compose: true,
  attach: true,
  reply: true,
  react: true,
  edit: false,
  delete: false,
  pin: false,
  copy: true,
  download: true,
  manageParticipants: false,
} as const;

const lockedDisputeCapabilities = {
  compose: false,
  attach: false,
  reply: true,
  react: true,
  edit: false,
  delete: false,
  pin: true,
  copy: true,
  download: true,
  manageParticipants: false,
} as const;

const directActiveConversations: ChatConversationRecord[] = [
  {
    id: "conv-direct-amir",
    type: "direct",
    title: amir.name,
    subtitle: `${amir.role} · ${amir.lastSeen}`,
    preview: "The admin review note is in the draft message.",
    updatedAt: "09:42",
    unreadCount: 2,
    participants: [me, amir],
    capabilitySet: fullCapabilities,
    sharedFiles: [
      file("shared-brief", "Launch brief v5.pdf", "Pinned for the current sprint"),
      file("shared-board", "handoff-board.png", "Latest board snapshot", "image", "vertical"),
    ],
    messages: [
      {
        id: "msg-direct-1",
        kind: "system",
        body: "Today · Direct chat opened from admin preview",
        createdAt: "09:11",
        reactions: [],
        attachments: [],
      },
      {
        id: "msg-direct-2",
        kind: "text",
        authorId: amir.id,
        body: "I moved the blocked deliverables into the new queue. Can you check the escalation note before I send it to the client?",
        createdAt: "09:15",
        status: "seen",
        reactions: reactions([["👍", 2, false], ["👀", 1, true]]),
        attachments: [],
        isPinned: true,
      },
      {
        id: "msg-direct-3",
        kind: "attachment",
        authorId: me.id,
        body: "Added the revised checklist and the visual context so the approval thread stays self-contained.",
        createdAt: "09:18",
        status: "seen",
        reactions: reactions([["✅", 1, true]]),
        attachments: [
          file("att-direct-1", "qa-checklist.docx", "12 KB · Final draft"),
          file("att-direct-2", "dashboard-snapshot.png", "1280 × 960", "image", "vertical"),
        ],
        replyPreview: "Can you check the escalation note before I send it to the client?",
        editedLabel: "Edited 09:19",
      },
      {
        id: "msg-direct-4",
        kind: "text",
        authorId: me.id,
        body: "This one intentionally shows a failed send state so the preview covers retry affordances.",
        createdAt: "09:21",
        status: "failed",
        reactions: [],
        attachments: [],
      },
      {
        id: "msg-direct-5",
        kind: "text",
        authorId: amir.id,
        body: "Perfect. If the client escalates anyway, I want the dispute thread and the project chat to feel consistent.",
        createdAt: "09:23",
        status: "delivered",
        reactions: reactions([["🔥", 1, false]]),
        attachments: [],
      },
    ],
  },
  {
    id: "conv-direct-hana",
    type: "direct",
    title: hana.name,
    subtitle: `${hana.role} · ${hana.lastSeen}`,
    preview: "Unread client-success handoff",
    updatedAt: "Yesterday",
    unreadCount: 0,
    participants: [me, hana],
    capabilitySet: fullCapabilities,
    sharedFiles: [],
    messages: [
      {
        id: "msg-hana-1",
        kind: "text",
        authorId: hana.id,
        body: "The onboarding packet is ready when you need it.",
        createdAt: "Yesterday, 16:10",
        status: "seen",
        reactions: [],
        attachments: [],
      },
    ],
  },
];

const groupBusyConversations: ChatConversationRecord[] = [
  {
    id: "conv-growth-war-room",
    type: "group",
    title: "Growth war room",
    subtitle: "5 participants · 3 online",
    preview: "Pinned launch checklist and a dense thread with mixed message states.",
    updatedAt: "10:05",
    unreadCount: 7,
    participants: [me, amir, lina, yara, omar],
    capabilitySet: fullCapabilities,
    sharedFiles: [
      file("shared-growth-1", "q4-launch-plan.pdf", "Pinned launch plan"),
      file("shared-growth-2", "creative-review.mov", "Video proof", "audio"),
    ],
    isPinned: true,
    messages: [
      {
        id: "msg-group-1",
        kind: "system",
        body: "Mon, Aug 5 · Campaign war room created",
        createdAt: "Mon",
        reactions: [],
        attachments: [],
      },
      {
        id: "msg-group-2",
        kind: "text",
        authorId: yara.id,
        body: "I need the PM sign-off before I move the paid media budget into active.",
        createdAt: "09:32",
        status: "seen",
        reactions: reactions([["✅", 3, true]]),
        attachments: [],
        isPinned: true,
      },
      {
        id: "msg-group-3",
        kind: "attachment",
        authorId: lina.id,
        body: "Creative handoff includes the mobile crops and the short-video storyboard.",
        createdAt: "09:37",
        status: "seen",
        reactions: reactions([["🎯", 2, false]]),
        attachments: [
          file("att-group-1", "storyboard.pdf", "8 pages · Review ready"),
          file("att-group-2", "mobile-crop.jpg", "Square crop", "image", "vertical"),
          file("att-group-3", "approval-note.wav", "Voice note · 24s", "audio"),
        ],
      },
      {
        id: "msg-group-4",
        kind: "text",
        authorId: omar.id,
        body: "I can wire the deep link after admin confirms which detail page owns the final CTA.",
        createdAt: "09:41",
        status: "delivered",
        reactions: reactions([["🧩", 1, false]]),
        attachments: [],
      },
      {
        id: "msg-group-5",
        kind: "text",
        authorId: me.id,
        body: "Use the dispute detail route as the escalation destination in the preview. We can remap it later when the adapter is live.",
        createdAt: "09:45",
        status: "sent",
        reactions: reactions([["👍", 2, false], ["📝", 1, true]]),
        attachments: [],
      },
      {
        id: "msg-group-6",
        kind: "system",
        body: "Typing preview: Yara and Amir are composing",
        createdAt: "09:46",
        reactions: [],
        attachments: [],
      },
    ],
  },
  {
    id: "conv-product-notes",
    type: "group",
    title: "Product notes",
    subtitle: "3 participants · muted",
    preview: "Lower priority reference thread",
    updatedAt: "08:12",
    unreadCount: 0,
    participants: [me, lina, omar],
    capabilitySet: fullCapabilities,
    sharedFiles: [],
    isMuted: true,
    messages: [
      {
        id: "msg-product-1",
        kind: "text",
        authorId: omar.id,
        body: "I documented the API gaps as explicit capabilities instead of hidden assumptions.",
        createdAt: "08:12",
        status: "seen",
        reactions: [],
        attachments: [],
      },
    ],
  },
];

const projectThreadConversations: ChatConversationRecord[] = [
  {
    id: "conv-project-al-nour",
    type: "project",
    title: "Al Nour website rollout",
    subtitle: "Project group · Files-first conversation",
    preview: "Attachment-heavy thread with a reply chain and shared assets.",
    updatedAt: "11:14",
    unreadCount: 0,
    participants: [me, amir, lina, omar],
    capabilitySet: fullCapabilities,
    sharedFiles: [
      file("shared-project-1", "site-map.fig", "Pinned shared artifact", "image", "vertical"),
      file("shared-project-2", "handoff-checklist.csv", "Task import sheet"),
    ],
    messages: [
      {
        id: "msg-project-1",
        kind: "text",
        authorId: amir.id,
        body: "Posting the final packet here so PM, design, and admin see the exact same context.",
        createdAt: "11:01",
        status: "seen",
        reactions: reactions([["📌", 1, true]]),
        attachments: [],
      },
      {
        id: "msg-project-2",
        kind: "attachment",
        authorId: lina.id,
        body: "Only attachments in this batch. The preview should still feel complete without relying on text.",
        createdAt: "11:05",
        status: "seen",
        reactions: [],
        attachments: [
          file("att-project-1", "hero-v2.png", "Homepage hero", "image", "vertical"),
          file("att-project-2", "feature-grid.png", "Grid explorations", "image", "vertical"),
          file("att-project-3", "qa-sheet.xlsx", "Release checklist"),
        ],
      },
      {
        id: "msg-project-3",
        kind: "text",
        authorId: me.id,
        body: "Keep this thread API-compatible with project group chat later. The adapter only needs participant and file mapping.",
        createdAt: "11:08",
        status: "delivered",
        reactions: reactions([["🧠", 2, false]]),
        attachments: [],
        replyPreview: "Posting the final packet here so PM, design, and admin see the exact same context.",
      },
    ],
  },
];

const taskCommentConversations: ChatConversationRecord[] = [
  {
    id: "conv-task-comment",
    type: "comment-thread",
    title: "Task comment thread",
    subtitle: "Execution comments · Permission-limited",
    preview: "Comments-style thread that reuses the same UI with stricter actions.",
    updatedAt: "14:27",
    unreadCount: 1,
    participants: [me, lina, omar],
    capabilitySet: limitedCommentCapabilities,
    sharedFiles: [file("shared-task-1", "research-links.md", "Supporting links")],
    statusNote: "Task comments allow replies and files, but not message editing or participant changes.",
    messages: [
      {
        id: "msg-task-1",
        kind: "system",
        body: "Task status changed to In review",
        createdAt: "14:03",
        reactions: [],
        attachments: [],
      },
      {
        id: "msg-task-2",
        kind: "text",
        authorId: lina.id,
        body: "Design QA passed on desktop. Mobile footer still needs spacing confirmation in the preview.",
        createdAt: "14:08",
        status: "seen",
        reactions: reactions([["👀", 1, true]]),
        attachments: [],
      },
      {
        id: "msg-task-3",
        kind: "attachment",
        authorId: me.id,
        body: "Reviewing from admin view. Attached the exact issue snapshot for the team thread.",
        createdAt: "14:11",
        status: "delivered",
        reactions: [],
        attachments: [file("att-task-1", "mobile-footer-bug.png", "390 × 844", "image", "vertical")],
      },
    ],
  },
];

const disputeThreadConversations: ChatConversationRecord[] = [
  {
    id: "conv-dispute-locked",
    type: "dispute-thread",
    title: "Dispute escalation #DP-204",
    subtitle: "Locked thread · Awaiting client confirmation",
    preview: "Shows a read-only thread with pinned context and a locked composer.",
    updatedAt: "16:10",
    unreadCount: 0,
    participants: [me, amir, rami, hana],
    capabilitySet: lockedDisputeCapabilities,
    sharedFiles: [
      file("shared-dispute-1", "resolution-summary.pdf", "Client-facing summary"),
      file("shared-dispute-2", "signed-variation.pdf", "Signed scope variation"),
    ],
    isLocked: true,
    statusNote:
      "This thread is locked in preview to represent dispute states where only history review is allowed.",
    messages: [
      {
        id: "msg-dispute-1",
        kind: "system",
        body: "Escalated from PM to admin review",
        createdAt: "15:20",
        reactions: [],
        attachments: [],
      },
      {
        id: "msg-dispute-2",
        kind: "text",
        authorId: rami.id,
        body: "I want the revised delivery date and cost impact documented in one place before I confirm closure.",
        createdAt: "15:33",
        status: "seen",
        reactions: reactions([["⚠️", 1, true]]),
        attachments: [],
      },
      {
        id: "msg-dispute-3",
        kind: "attachment",
        authorId: me.id,
        body: "Admin summary attached and pinned for consistent handoff.",
        createdAt: "15:39",
        status: "seen",
        reactions: reactions([["📌", 1, true]]),
        attachments: [
          file("att-dispute-1", "admin-summary.pdf", "Resolution summary"),
          file("att-dispute-2", "timeline-proof.png", "Evidence timeline", "image", "vertical"),
        ],
        isPinned: true,
      },
    ],
  },
];

const emptyConversationState: ChatConversationRecord[] = [];

const errorStateConversations: ChatConversationRecord[] = [
  {
    id: "conv-error-preview",
    type: "direct",
    title: "Connection diagnostics",
    subtitle: "Error state sample",
    preview: "The thread exists, but loading failed in this scenario.",
    updatedAt: "17:02",
    unreadCount: 0,
    participants: [me, hana],
    capabilitySet: fullCapabilities,
    sharedFiles: [],
    messages: [],
  },
];

const offlineStateConversations: ChatConversationRecord[] = [
  {
    id: "conv-offline",
    type: "group",
    title: "Offline queue",
    subtitle: "Queued send preview",
    preview: "Composer disabled because transport is offline.",
    updatedAt: "18:05",
    unreadCount: 0,
    participants: [me, amir, omar],
    capabilitySet: {
      ...fullCapabilities,
      compose: false,
      attach: false,
    },
    sharedFiles: [],
    statusNote: "Messages are viewable, but sending is disabled until the transport reconnects.",
    messages: [
      {
        id: "msg-offline-1",
        kind: "text",
        authorId: amir.id,
        body: "This scenario exists to validate offline and reconnecting chrome without backend wiring.",
        createdAt: "18:00",
        status: "seen",
        reactions: [],
        attachments: [],
      },
      {
        id: "msg-offline-2",
        kind: "text",
        authorId: me.id,
        body: "Queued messages should remain visible as drafts or disabled composer states.",
        createdAt: "18:02",
        status: "sending",
        reactions: [],
        attachments: [],
      },
    ],
  },
];

export const chatPreviewScenarios: ChatPreviewScenario[] = [
  {
    id: "direct-active",
    title: "Direct active",
    description: "Primary one-to-one thread with reply, attachment, and failed-send coverage.",
    connection: "connected",
    notice: "Use this scenario to review the full composer and message-action surface.",
    conversations: directActiveConversations,
    defaultConversationId: "conv-direct-amir",
    defaultDraft: "Add your approval note here.",
  },
  {
    id: "group-busy",
    title: "Group busy",
    description: "Dense shared thread with multiple participants, unread counters, and typing markers.",
    connection: "reconnecting",
    notice: "This scenario keeps the conversation live while showing reconnecting chrome.",
    conversations: groupBusyConversations,
    defaultConversationId: "conv-growth-war-room",
    defaultDraft: "Confirm the final CTA destination before launch.",
  },
  {
    id: "project-thread",
    title: "Project thread",
    description: "Attachment-heavy project workspace preview with shared file context.",
    connection: "connected",
    notice: "Project group chat should later map directly to the backend project conversation.",
    conversations: projectThreadConversations,
    defaultConversationId: "conv-project-al-nour",
    defaultDraft: "",
  },
  {
    id: "task-comment-thread",
    title: "Task comments",
    description: "Comment-thread adapter preview with restricted message actions.",
    connection: "connected",
    notice: "This proves that task comments can reuse the same UI while disabling unsupported actions.",
    conversations: taskCommentConversations,
    defaultConversationId: "conv-task-comment",
    defaultDraft: "Requesting final mobile confirmation before closing the task.",
  },
  {
    id: "dispute-escalation-thread",
    title: "Dispute thread",
    description: "Locked dispute conversation with pinned context and read-only composition state.",
    connection: "connected",
    notice: "Dispute messaging should feel consistent with chat while clearly respecting state-machine locks.",
    conversations: disputeThreadConversations,
    defaultConversationId: "conv-dispute-locked",
    defaultDraft: "",
  },
  {
    id: "empty-state",
    title: "Empty state",
    description: "No conversations yet so the route can show the list-empty and no-selection states.",
    connection: "connected",
    notice: "Use this to validate onboarding copy and the empty chat surface without app shell dependencies.",
    conversations: emptyConversationState,
    defaultConversationId: null,
    defaultDraft: "",
  },
  {
    id: "error-state",
    title: "Error state",
    description: "Preview of request failure chrome before the live adapter exists.",
    connection: "error",
    notice: "Use this to validate error, retry, and degraded navigation states.",
    conversations: errorStateConversations,
    defaultConversationId: "conv-error-preview",
    defaultDraft: "",
  },
  {
    id: "offline-state",
    title: "Offline state",
    description: "Transport is offline and composition is disabled while history remains readable.",
    connection: "offline",
    notice: "This is the preview for offline, last-seen, and disabled composer behavior.",
    conversations: offlineStateConversations,
    defaultConversationId: "conv-offline",
    defaultDraft: "This message will wait for reconnection.",
  },
];

export function getChatPreviewScenario(id: ChatScenarioId): ChatPreviewScenario {
  const scenario = chatPreviewScenarios.find((item) => item.id === id);

  if (!scenario) {
    throw new Error(`Unknown chat preview scenario: ${id}`);
  }

  return JSON.parse(JSON.stringify(scenario)) as ChatPreviewScenario;
}
