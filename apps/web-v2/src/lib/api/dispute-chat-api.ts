"use client";

import { baseApi } from "@/lib/api/base-api";

export type DisputeThreadType = "CLIENT_PM" | "ADMIN_CLIENT" | "ADMIN_PM";

export type DisputeThreadSummary = {
  threadType: DisputeThreadType;
  title: string;
  description: string;
  participantsLabel: string;
  canReply: boolean;
  messageCount: number;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    authorName: string;
    authorRole: "CLIENT" | "PM" | "ADMIN";
  } | null;
};

export type DisputeThreadMessage = {
  id: string;
  threadType: DisputeThreadType;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: "CLIENT" | "PM" | "ADMIN";
  };
  attachments: Array<{
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string | null;
    url: string | null;
  }>;
};

function buildMessageFormData(args: { content: string; files: File[] }) {
  const formData = new FormData();
  formData.append("content", args.content);

  for (const file of args.files) {
    formData.append("files", file);
  }

  return formData;
}

export const disputeChatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDisputeThreads: builder.query<DisputeThreadSummary[], string>({
      query: (disputeId) => ({ url: `/admin/disputes/${disputeId}/threads` }),
      providesTags: ["Delivery"],
    }),
    getAdminDisputeThreadMessages: builder.query<
      DisputeThreadMessage[],
      { disputeId: string; threadType: DisputeThreadType }
    >({
      query: ({ disputeId, threadType }) => ({
        url: `/admin/disputes/${disputeId}/threads/${threadType}/messages`,
      }),
      providesTags: ["Delivery"],
    }),
    sendAdminDisputeThreadMessage: builder.mutation<
      DisputeThreadMessage,
      {
        disputeId: string;
        threadType: DisputeThreadType;
        content: string;
        files?: File[];
      }
    >({
      query: ({ disputeId, threadType, content, files = [] }) => {
        if (files.length > 0) {
          return {
            url: `/admin/disputes/${disputeId}/threads/${threadType}/messages`,
            method: "POST",
            body: buildMessageFormData({ content, files }),
          };
        }

        return {
          url: `/admin/disputes/${disputeId}/threads/${threadType}/messages`,
          method: "POST",
          body: { content },
        };
      },
      invalidatesTags: ["Delivery"],
    }),
  }),
});

export const {
  useGetAdminDisputeThreadMessagesQuery,
  useGetAdminDisputeThreadsQuery,
  useSendAdminDisputeThreadMessageMutation,
} = disputeChatApi;
