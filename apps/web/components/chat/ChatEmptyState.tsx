"use client";

import { CheckCircle2, MessageCircle, MessageSquare, Paperclip } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-sm px-8 text-center">
        {/* Illustration */}
        <div className="relative mx-auto mb-6 size-24">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
          <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="size-10 text-primary" />
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
        <div className="flex flex-col gap-3 text-right">
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <MessageCircle className="size-4 text-primary" aria-hidden="true" />
            </div>
            <p className="text-xs text-muted-foreground">
              تواصل مع فريق العمل والعملاء بشكل مباشر
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Paperclip className="size-4 text-primary" aria-hidden="true" />
            </div>
            <p className="text-xs text-muted-foreground">
              أرفق الملفات والصور بسهولة
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
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
