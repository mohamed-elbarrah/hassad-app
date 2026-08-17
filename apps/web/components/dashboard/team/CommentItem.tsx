"use client";

import { formatRelativeTime } from "@/lib/format";
import type { TaskComment } from "@hassad/shared";

interface CommentItemProps {
  comment: TaskComment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const authorName = comment.user?.name ?? "مستخدم";
  const initials = authorName.charAt(0);

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-white border border-portal-card-border">
      <div className="w-9 h-9 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center font-semibold text-sm shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-natural-100">
            {authorName}
          </span>
          <span className="text-[11px] text-neutral-400">
            {formatRelativeTime(comment.createdAt as string)}
          </span>
        </div>
        <p className="text-sm text-neutral-600 mt-1 whitespace-pre-wrap break-words leading-relaxed">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
