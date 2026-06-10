"use client";

import { MessageSquare } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50">
        <MessageSquare className="h-8 w-8 text-neutral-300" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">ابدأ محادثة</h3>
        <p className="mt-1 text-sm text-neutral-300">
          اختر محادثة من القائمة للبدء
        </p>
      </div>
    </div>
  );
}
