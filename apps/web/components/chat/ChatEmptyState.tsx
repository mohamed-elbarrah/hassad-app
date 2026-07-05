"use client";

import { MessageSquare } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-natural-0 to-badge-gray-bg/30">
      <div className="text-center px-8 max-w-sm">
        {/* Illustration */}
        <div className="relative mx-auto mb-6 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-secondary-500/10 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-secondary-500/10 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-secondary-500" />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-natural-100 mb-2">
          مرحباً بك في المحادثات
        </h3>
        <p className="text-sm text-portal-note-text leading-relaxed mb-6">
          اختر محادثة من القائمة لبدء المراسلة، أو أنشئ محادثة جديدة للتواصل مع
          فريقك وعملائك.
        </p>

        {/* Feature hints */}
        <div className="space-y-3 text-right">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-badge-gray-bg">
            <div className="w-8 h-8 rounded-lg bg-secondary-500/10 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-secondary-500"
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
            <p className="text-xs text-portal-note-text">
              تواصل مع فريق العمل والعملاء بشكل مباشر
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-badge-gray-bg">
            <div className="w-8 h-8 rounded-lg bg-secondary-500/10 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-secondary-500"
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
            <p className="text-xs text-portal-note-text">
              أرفق الملفات والصور بسهولة
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-badge-gray-bg">
            <div className="w-8 h-8 rounded-lg bg-secondary-500/10 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-secondary-500"
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
            <p className="text-xs text-portal-note-text">
              استلم إشعارات فورية عند وصول رسائل جديدة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
