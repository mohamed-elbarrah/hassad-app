import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { AiAssistantArea } from "@hassad/shared";

export interface AiConversation {
  id: string;
  userId: string;
  title: string | null;
  areas: AiAssistantArea[];
  preferences: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: AiMessage[];
  _count?: { messages: number };
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string | null;
  toolCalls: Record<string, unknown>[] | null;
  tokensUsed: number | null;
  createdAt: string;
}

export interface CreateConversationInput {
  title?: string;
  areas: AiAssistantArea[];
}

export interface SendMessageInput {
  content: string;
}

export const aiAssistantApi = createApi({
  reducerPath: "aiAssistantApi",
  baseQuery,
  tagTypes: ["AiConversations", "AiConversation"],
  endpoints: (builder) => ({
    getConversations: builder.query<AiConversation[], void>({
      query: () => "/ai-assistant/conversations",
      providesTags: ["AiConversations"],
    }),

    getConversation: builder.query<AiConversation, string>({
      query: (id) => `/ai-assistant/conversations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AiConversation", id }],
    }),

    createConversation: builder.mutation<AiConversation, CreateConversationInput>(
      {
        query: (body) => ({
          url: "/ai-assistant/conversations",
          method: "POST",
          body,
        }),
        invalidatesTags: ["AiConversations"],
      },
    ),

    deleteConversation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/ai-assistant/conversations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AiConversations"],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useDeleteConversationMutation,
} = aiAssistantApi;
