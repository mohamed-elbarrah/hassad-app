"use client";

import { baseApi } from "@/lib/api/base-api";
import type {
  ChatAttachmentRecord,
  ChatConversationRecord,
  ChatMessageRecord,
  ChatParticipantRecord,
  ChatTargetOption,
} from "@/features/chat/lib/chat-runtime";

type RawParticipant = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

type RawMessage = {
  id: string;
  conversationId: string;
  content: string;
  displayContent: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  sender: RawParticipant;
  deletedBy: { id: string; name: string } | null;
  attachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    filePath: string;
    uploadedAt: string | null;
    url: string | null;
  }>;
  replyTo: {
    id: string;
    content: string;
    senderName: string;
  } | null;
};

type RawConversation = {
  id: string;
  type: "DIRECT" | "GROUP" | "PROJECT";
  title: string | null;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
  clientId: string | null;
  clientName: string | null;
  project: { id: string; name: string } | null;
  participants: RawParticipant[];
  messageCount?: number;
  lastMessage?: RawMessage | null;
};

function mapParticipant(participant: RawParticipant): ChatParticipantRecord {
  return {
    id: participant.id,
    name: participant.name,
    email: participant.email,
    avatarUrl: participant.avatarUrl,
    isActive: participant.isActive,
    lastLoginAt: participant.lastLoginAt,
  };
}

function mapAttachment(attachment: RawMessage["attachments"][number]): ChatAttachmentRecord {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    filePath: attachment.filePath,
    uploadedAt: attachment.uploadedAt,
    url: attachment.url,
  };
}

function mapMessage(message: RawMessage): ChatMessageRecord {
  return {
    id: message.id,
    conversationId: message.conversationId,
    content: message.content,
    displayContent: message.displayContent,
    createdAt: message.createdAt,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
    sender: mapParticipant(message.sender),
    deletedBy: message.deletedBy,
    attachments: message.attachments.map(mapAttachment),
    replyTo: message.replyTo,
  };
}

function mapConversation(conversation: RawConversation): ChatConversationRecord {
  return {
    id: conversation.id,
    type: conversation.type,
    title: conversation.title,
    isActive: conversation.isActive,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
    clientId: conversation.clientId,
    clientName: conversation.clientName,
    project: conversation.project,
    participants: conversation.participants.map(mapParticipant),
    messageCount: conversation.messageCount,
    lastMessage: conversation.lastMessage ? mapMessage(conversation.lastMessage) : null,
  };
}

function buildMessageFormData(args: {
  content: string;
  parentMessageId?: string | null;
  files: File[];
}) {
  const formData = new FormData();
  formData.append("content", args.content);

  if (args.parentMessageId) {
    formData.append("parentMessageId", args.parentMessageId);
  }

  for (const file of args.files) {
    formData.append("files", file);
  }

  return formData;
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChatConversations: builder.query<
      { data: ChatConversationRecord[]; total: number; page: number; limit: number },
      { type?: "DIRECT" | "GROUP" | "PROJECT" }
    >({
      query: (params) => ({ url: "/conversations", params }),
      transformResponse: (response: {
        data: RawConversation[];
        total: number;
        page: number;
        limit: number;
      }) => ({
        ...response,
        data: response.data.map(mapConversation),
      }),
      providesTags: ["Chat"],
    }),
    getChatMessages: builder.query<ChatMessageRecord[], string>({
      query: (conversationId) => ({ url: `/conversations/${conversationId}/messages` }),
      transformResponse: (response: RawMessage[]) => response.map(mapMessage),
      providesTags: ["Chat"],
    }),
    searchEmployeeChatTargets: builder.query<
      ChatTargetOption[],
      { search: string; limit?: number }
    >({
      query: ({ search, limit = 6 }) => ({
        url: "/admin/users",
        params: {
          search,
          limit,
          excludeRole: "CLIENT",
          status: "active",
        },
      }),
      transformResponse: (response: {
        items: Array<{
          id: string;
          name: string;
          email: string;
          role: string;
          avatarUrl: string | null;
          isActive: boolean;
          lastLoginAt: string | null;
        }>;
      }) =>
        response.items.map((item) => ({
          userId: item.id,
          name: item.name,
          subtitle: `${item.role} · ${item.email}`,
          kind: "employee",
          avatarUrl: item.avatarUrl,
          isActive: item.isActive,
          lastLoginAt: item.lastLoginAt,
        })),
    }),
    searchClientChatTargets: builder.query<
      ChatTargetOption[],
      { search: string; limit?: number }
    >({
      query: ({ search, limit = 6 }) => ({
        url: "/admin/clients/users",
        params: {
          search,
          limit,
        },
      }),
      transformResponse: (response: {
        items: Array<{
          id: string;
          name: string;
          email: string;
          companyName: string | null;
          status: string;
          lastLoginAt: string | null;
        }>;
      }) =>
        response.items.map((item) => ({
          userId: item.id,
          name: item.name,
          subtitle: `${item.companyName ?? item.email} · ${item.status}`,
          kind: "client",
          avatarUrl: null,
          isActive: true,
          lastLoginAt: item.lastLoginAt,
        })),
    }),
    sendConversationMessage: builder.mutation<
      ChatMessageRecord,
      {
        conversationId: string;
        content: string;
        parentMessageId?: string | null;
        files?: File[];
      }
    >({
      query: ({ conversationId, content, parentMessageId, files = [] }) => {
        if (files.length > 0) {
          return {
            url: `/conversations/${conversationId}/messages/with-files`,
            method: "POST",
            body: buildMessageFormData({ content, parentMessageId, files }),
          };
        }

        return {
          url: `/conversations/${conversationId}/messages`,
          method: "POST",
          body: { content, parentMessageId },
        };
      },
      transformResponse: (response: RawMessage) => mapMessage(response),
      invalidatesTags: ["Chat"],
    }),
    sendDirectMessage: builder.mutation<
      ChatMessageRecord,
      {
        userId: string;
        content: string;
        parentMessageId?: string | null;
        files?: File[];
      }
    >({
      query: ({ userId, content, parentMessageId, files = [] }) => {
        if (files.length > 0) {
          return {
            url: `/conversations/direct/${userId}/messages/with-files`,
            method: "POST",
            body: buildMessageFormData({ content, parentMessageId, files }),
          };
        }

        return {
          url: `/conversations/direct/${userId}/messages`,
          method: "POST",
          body: { content, parentMessageId },
        };
      },
      transformResponse: (response: RawMessage) => mapMessage(response),
      invalidatesTags: ["Chat"],
    }),
    updateChatMessage: builder.mutation<
      ChatMessageRecord,
      { conversationId: string; messageId: string; content: string }
    >({
      query: ({ conversationId, messageId, content }) => ({
        url: `/conversations/${conversationId}/messages/${messageId}`,
        method: "PATCH",
        body: { content },
      }),
      transformResponse: (response: RawMessage) => mapMessage(response),
      invalidatesTags: ["Chat"],
    }),
    deleteChatMessage: builder.mutation<
      ChatMessageRecord,
      { conversationId: string; messageId: string }
    >({
      query: ({ conversationId, messageId }) => ({
        url: `/conversations/${conversationId}/messages/${messageId}`,
        method: "DELETE",
      }),
      transformResponse: (response: RawMessage) => mapMessage(response),
      invalidatesTags: ["Chat"],
    }),
  }),
});

export const {
  useDeleteChatMessageMutation,
  useGetChatConversationsQuery,
  useGetChatMessagesQuery,
  useSearchClientChatTargetsQuery,
  useSearchEmployeeChatTargetsQuery,
  useSendConversationMessageMutation,
  useSendDirectMessageMutation,
  useUpdateChatMessageMutation,
} = chatApi;
