import { MessageSquare } from "lucide-react";
import type { TaskComment } from "@hassad/shared";

interface CommentItemProps {
  comment: TaskComment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const authorName = comment.user?.name ?? "مستخدم";
  const date = new Date(comment.createdAt);
  const formattedDate = date.toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex gap-3 text-sm">
      <div className="mt-0.5 shrink-0 rounded-full bg-muted p-1.5">
        <MessageSquare className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium">{authorName}</span>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        <p className="text-muted-foreground whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
