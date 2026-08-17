import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ConversationUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  user: ConversationUser;
}

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
  uploadedAt: string;
  url?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: ConversationUser;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP";
  title: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  client: ConversationClient | null;
  project: ConversationProject | null;
  participants: ConversationParticipant[];
  messages?: Message[];
}

export interface PaginatedConversations {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
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

// ── API slice ─────────────────────────────────────────────────────────────────

export const chatApi = createApi({
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
        return `/conversations${qs ? `?${qs}` : ""}`;
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
      query: (id) => `/conversations/${id}`,
      providesTags: (_, __, id) => [{ type: "Conversation", id }],
    }),

    getProjectGroupChat: builder.query<Conversation, string>({
      query: (projectId) => `/conversations/project/${projectId}/group`,
      providesTags: (_, __, projectId) => [
        { type: "Conversation", id: `project-${projectId}-group` },
      ],
    }),

    getDirectConversation: builder.query<Conversation, string>({
      query: (userId) => `/conversations/direct/${userId}`,
      providesTags: (_, __, userId) => [
        { type: "Conversation", id: `direct-${userId}` },
      ],
    }),

    createDirectConversation: builder.mutation<
      Conversation,
      CreateDirectConversationInput
    >({
      query: (body) => ({
        url: "/conversations",
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
        url: "/conversations",
        method: "POST",
        body: { type: "GROUP", ...body },
      }),
      invalidatesTags: [{ type: "Conversation", id: "LIST" }],
    }),

    addParticipant: builder.mutation<Conversation, AddParticipantInput>({
      query: ({ conversationId, userId }) => ({
        url: `/conversations/${conversationId}/participants`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: (_, __, { conversationId }) => [
        { type: "Conversation", id: conversationId },
        { type: "Conversation", id: "LIST" },
      ],
    }),

    getMessages: builder.query<
      Message[],
      { conversationId: string; page?: number; limit?: number }
    >({
      query: ({ conversationId, page, limit }) => {
        const params = new URLSearchParams();
        if (page) params.set("page", String(page));
        if (limit) params.set("limit", String(limit));
        const qs = params.toString();
        return `/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`;
      },
      providesTags: (_, __, { conversationId }) => [
        { type: "Message", id: conversationId },
      ],
    }),

    sendMessage: builder.mutation<Message, CreateMessageInput>({
      query: ({ conversationId, content }) => ({
        url: `/conversations/${conversationId}/messages`,
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
          url: `/conversations/${conversationId}/messages/with-files`,
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
  useSendMessageMutation,
  useSendMessageWithFilesMutation,
} = chatApi;
