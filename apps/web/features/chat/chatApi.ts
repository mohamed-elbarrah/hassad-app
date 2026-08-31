import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ConversationUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  isOnline: boolean;
}

/** Participants are returned as user records, not join records with a nested user. */
export type ConversationParticipant = ConversationUser;

export interface ConversationClient {
  id: string;
  companyName: string;
  contactName: string;
}

export interface ConversationProject {
  id: string;
  name: string;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  filePath: string;
  fileName: string;
  fileType: string;
  uploadedAt: string | null;
  url: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  /** Empty for deleted messages; displayContent is the backend presentation value. */
  displayContent: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  sender: ConversationUser;
  attachments: MessageAttachment[];
}

export interface ChatUnreadCountEvent {
  conversationId: string;
  unreadCount: number;
}

export interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP";
  title: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  clientId: string | null;
  clientName: string | null;
  project: ConversationProject | null;
  participants: ConversationParticipant[];
  messageCount?: number;
  lastMessage?: Message | null;
  /** Server-maintained unread count for the current user. */
  unreadCount: number;
}

export interface PaginatedConversations {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface MessageHistory {
  data: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

type MessageHistoryResponse =
  | MessageHistory
  | Message[]
  | { data: unknown; nextCursor?: unknown; hasMore?: unknown; meta?: unknown };

type PaginationMetadata = {
  nextCursor: string | null;
  hasMore: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readPagination = (...sources: unknown[]): PaginationMetadata => {
  let nextCursor: string | null | undefined;
  let hasMore: boolean | undefined;

  for (const source of sources) {
    if (!isRecord(source)) continue;
    if (
      nextCursor === undefined &&
      (typeof source.nextCursor === "string" || source.nextCursor === null)
    ) {
      nextCursor = source.nextCursor as string | null;
    }
    if (hasMore === undefined && typeof source.hasMore === "boolean") {
      hasMore = source.hasMore;
    }
  }

  return {
    nextCursor: nextCursor ?? null,
    hasMore: hasMore ?? Boolean(nextCursor),
  };
};

function normalizeMessageHistory(
  response: MessageHistoryResponse,
  meta: unknown,
): MessageHistory {
  // baseQuery owns standard-envelope unwrapping. This parser only handles the
  // already-unwrapped array/object variants, avoiding a second unwrap here.
  if (Array.isArray(response)) {
    const transportMeta = isRecord(meta) ? meta.apiMeta : undefined;
    return {
      data: response as Message[],
      ...readPagination(transportMeta, meta),
    };
  }

  if (
    isRecord(response) &&
    response["success"] !== true &&
    Array.isArray(response.data)
  ) {
    const transportMeta = isRecord(meta) ? meta.apiMeta : undefined;
    return {
      data: response.data as Message[],
      ...readPagination(response, response.meta, transportMeta, meta),
    };
  }

  // Keep malformed payloads from leaking into merge(), where they would
  // otherwise fail with an opaque `data.map is not a function` error.
  return { data: [], nextCursor: null, hasMore: false };
}

export interface GetConversationsParams {
  page?: number;
  limit?: number;
  type?: "DIRECT" | "GROUP";
  clientId?: string;
  projectId?: string;
}

export interface CreateDirectConversationInput {
  userId: string;
}

export interface CreateGroupConversationInput {
  title: string;
  participantIds: string[];
}

export interface CreateMessageInput {
  conversationId: string;
  content: string;
}

export interface AddParticipantInput {
  conversationId: string;
  userId: string;
}

export interface GetMessagesParams {
  conversationId: string;
  limit?: number;
  cursor?: string;
}

/** Must stay aligned with the server's chat upload limit. */
export const CHAT_MAX_FILES = 5;

// ── API slice ─────────────────────────────────────────────────────────────────

// Keep the shared slice compatible with dashboard/PM consumers while routing
// the portal page through its portal-owned API. The backend adapter delegates
// to the same ChatService, so DTOs and cache behavior remain identical.
const isPortalChat = () =>
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/portal");

const chatUrl = (path: string) =>
  isPortalChat() ? `/portal/chat${path}` : path;

export const chatApi = createApi({
  // The URL is portal-aware, so keep portal and dashboard responses in
  // separate caches even when they use the same endpoint arguments.
  serializeQueryArgs: ({ endpointName, queryArgs }) =>
    `${isPortalChat() ? "portal" : "shared"}:${endpointName}:${JSON.stringify(queryArgs)}`,
  reducerPath: "chatApi",
  baseQuery,
  tagTypes: ["Conversation", "Message"],
  endpoints: (builder) => ({
    getConversations: builder.query<
      PaginatedConversations,
      GetConversationsParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.type) searchParams.set("type", params.type);
        if (params?.clientId) searchParams.set("clientId", params.clientId);
        if (params?.projectId) searchParams.set("projectId", params.projectId);
        const qs = searchParams.toString();
        return chatUrl(`/conversations${qs ? `?${qs}` : ""}`);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Conversation" as const,
                id,
              })),
              { type: "Conversation", id: "LIST" },
            ]
          : [{ type: "Conversation", id: "LIST" }],
    }),

    getConversation: builder.query<Conversation, string>({
      query: (id) => chatUrl(`/conversations/${id}`),
      providesTags: (_, __, id) => [{ type: "Conversation", id }],
    }),

    getProjectGroupChat: builder.query<Conversation, string>({
      query: (projectId) =>
        chatUrl(`/conversations/project/${projectId}/group`),
      providesTags: (_, __, projectId) => [
        { type: "Conversation", id: `project-${projectId}-group` },
      ],
    }),

    getDirectConversation: builder.query<Conversation, string>({
      query: (userId) => chatUrl(`/conversations/direct/${userId}`),
      providesTags: (_, __, userId) => [
        { type: "Conversation", id: `direct-${userId}` },
      ],
    }),

    createDirectConversation: builder.mutation<
      Conversation,
      CreateDirectConversationInput
    >({
      query: (body) => ({
        url: chatUrl("/conversations"),
        method: "POST",
        body: { type: "DIRECT", participantIds: [body.userId] },
      }),
      invalidatesTags: [{ type: "Conversation", id: "LIST" }],
    }),

    createGroupConversation: builder.mutation<
      Conversation,
      CreateGroupConversationInput
    >({
      query: (body) => ({
        url: chatUrl("/conversations"),
        method: "POST",
        body: { type: "GROUP", ...body },
      }),
      invalidatesTags: [{ type: "Conversation", id: "LIST" }],
    }),

    addParticipant: builder.mutation<Conversation, AddParticipantInput>({
      query: ({ conversationId, userId }) => ({
        url: chatUrl(`/conversations/${conversationId}/participants`),
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: (_, __, { conversationId }) => [
        { type: "Conversation", id: conversationId },
        { type: "Conversation", id: "LIST" },
      ],
    }),

    getMessages: builder.query<MessageHistory, GetMessagesParams>({
      query: ({ conversationId, cursor, limit }) => {
        const params = new URLSearchParams();
        if (limit) params.set("limit", String(limit));
        if (cursor) params.set("cursor", cursor);
        const qs = params.toString();
        return chatUrl(
          `/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`,
        );
      },
      transformResponse: (response: MessageHistoryResponse, meta) =>
        normalizeMessageHistory(response, meta),
      // Keep history pages in RTK Query's cache. Components never maintain a
      // second copy of server messages; a cursor fetch only extends this entry.
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${isPortalChat() ? "portal" : "shared"}:${endpointName}:${queryArgs.conversationId}:${queryArgs.limit ?? 50}`,
      merge: (currentCache, incoming, { arg }) => {
        const incomingIds = new Set(incoming.data.map((message) => message.id));
        const retained = arg.cursor
          ? currentCache.data.filter((message) => !incomingIds.has(message.id))
          : currentCache.data.filter((message) => {
              if (incomingIds.has(message.id)) return false;
              const first = incoming.data[0];
              if (!first) return true;
              const messageTime = new Date(message.createdAt).getTime();
              const firstTime = new Date(first.createdAt).getTime();
              return messageTime < firstTime ||
                (messageTime === firstTime && message.id.localeCompare(first.id) < 0);
            });
        const merged = arg.cursor
          ? [...incoming.data, ...retained]
          : [...retained, ...incoming.data];

        // Keep the display contract stable even when a reconnect/refetch
        // refreshes the latest page after older pages were loaded.
        const byId = new Map(merged.map((message) => [message.id, message]));
        currentCache.data = [...byId.values()].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
            a.id.localeCompare(b.id),
        );
        currentCache.nextCursor = incoming.nextCursor;
        currentCache.hasMore = incoming.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.conversationId !== previousArg?.conversationId ||
        currentArg?.limit !== previousArg?.limit ||
        currentArg?.cursor !== previousArg?.cursor,
      providesTags: (_, __, { conversationId }) => [
        { type: "Message", id: conversationId },
      ],
    }),

    markConversationRead: builder.mutation<
      { conversationId: string; lastReadAt: string; unreadCount: number },
      string
    >({
      query: (conversationId) => ({
        url: chatUrl(`/conversations/${conversationId}/read`),
        method: "POST",
      }),
      invalidatesTags: (_, __, conversationId) => [
        { type: "Conversation", id: conversationId },
        { type: "Conversation", id: "LIST" },
      ],
    }),

    sendMessage: builder.mutation<Message, CreateMessageInput>({
      query: ({ conversationId, content }) => ({
        url: chatUrl(`/conversations/${conversationId}/messages`),
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_, __, { conversationId }) => [
        { type: "Message", id: conversationId },
        { type: "Conversation", id: conversationId },
        { type: "Conversation", id: "LIST" },
      ],
    }),

    sendMessageWithFiles: builder.mutation<
      Message,
      { conversationId: string; content: string; files: File[] }
    >({
      query: ({ conversationId, content, files }) => {
        const formData = new FormData();
        formData.append("content", content);
        files.forEach((file) => {
          formData.append("files", file);
        });
        return {
          url: chatUrl(`/conversations/${conversationId}/messages/with-files`),
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_, __, { conversationId }) => [
        { type: "Message", id: conversationId },
        { type: "Conversation", id: conversationId },
        { type: "Conversation", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useLazyGetProjectGroupChatQuery,
  useLazyGetDirectConversationQuery,
  useCreateDirectConversationMutation,
  useCreateGroupConversationMutation,
  useAddParticipantMutation,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useMarkConversationReadMutation,
  useSendMessageMutation,
  useSendMessageWithFilesMutation,
} = chatApi;
