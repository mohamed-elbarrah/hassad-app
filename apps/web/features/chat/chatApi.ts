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

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: ConversationUser;
  attachments?: MessageAttachment[];
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

export interface Conversation {
  id: string;
  type: "SALES" | "PM";
  clientId: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  client: ConversationClient;
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
  type?: "SALES" | "PM";
  clientId?: string;
}

export interface CreateConversationInput {
  type: "SALES" | "PM";
  clientId: string;
  title: string;
  participantIds: string[];
}

export interface CreateMessageInput {
  conversationId: string;
  content: string;
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

    getOrCreateConversation: builder.query<
      Conversation,
      { clientId: string; type: "SALES" | "PM" }
    >({
      query: ({ clientId, type }) =>
        `/conversations/by-client/${clientId}/${type}`,
      providesTags: (_, __, { clientId, type }) => [
        { type: "Conversation", id: `${clientId}-${type}` },
      ],
    }),

    createConversation: builder.mutation<
      Conversation,
      CreateConversationInput
    >({
      query: (body) => ({
        url: "/conversations",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Conversation", id: "LIST" }],
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
      query: (body) => ({
        url: "/messages",
        method: "POST",
        body,
      }),
      invalidatesTags: (_, __, { conversationId }) => [
        { type: "Message", id: conversationId },
        { type: "Conversation", id: "LIST" },
      ],
    }),

    sendMessageWithFiles: builder.mutation<
      Message,
      { conversationId: string; content: string; files: File[] }
    >({
      query: ({ conversationId, content, files }) => {
        const formData = new FormData();
        formData.append("conversationId", conversationId);
        formData.append("content", content);
        files.forEach((file) => {
          formData.append("files", file);
        });
        return {
          url: "/messages/with-files",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_, __, { conversationId }) => [
        { type: "Message", id: conversationId },
        { type: "Conversation", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useGetOrCreateConversationQuery,
  useCreateConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useSendMessageWithFilesMutation,
} = chatApi;