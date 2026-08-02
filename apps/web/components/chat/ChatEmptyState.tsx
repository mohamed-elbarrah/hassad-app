"use client";

import { MessageSquare } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-sm px-8 text-center">
        {/* Illustration */}
        <div className="relative mx-auto mb-6 h-24 w-24">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
        </div>

        <h3 className="mb-2 text-xl font-semibold text-foreground">
          مرحباً بك في المحادثات
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          اختر محادثة من القائمة لبدء المراسلة، أو أنشئ محادثة جديدة للتواصل مع
          فريقك وعملائك.
        </p>

        {/* Feature hints */}
        <div className="space-y-3 text-right">
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-4 w-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">
              تواصل مع فريق العمل والعملاء بشكل مباشر
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-4 w-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">
              أرفق الملفات والصور بسهولة
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-4 w-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">
              استلم إشعارات فورية عند وصول رسائل جديدة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
