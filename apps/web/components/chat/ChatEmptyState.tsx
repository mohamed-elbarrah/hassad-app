"use client";

import { MessageSquare } from "lucide-react";
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";

export function ChatEmptyState() {
  return (
    <PortalEmptyState
      icon={MessageSquare}
      title="ابدأ محادثة"
      description="اختر محادثة من القائمة للبدء"
    />
  );
}
