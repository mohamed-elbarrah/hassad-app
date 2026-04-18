"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toggleDropdown } from "@/features/notifications/notificationsSlice";
import { useGetUnreadCountQuery } from "@/features/notifications/notificationsApi";
import { NotificationsDropdown } from "./NotificationsDropdown";

export function NotificationBell() {
  const dispatch = useAppDispatch();
  const { unreadCount, isDropdownOpen } = useAppSelector(
    (state) => state.notifications,
  );

  // Poll every 30 seconds — prepared for future WebSocket replacement
  useGetUnreadCountQuery(undefined, { pollingInterval: 30000 });

  const displayCount =
    unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => dispatch(toggleDropdown())}
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {displayCount !== null && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
          >
            {displayCount}
          </Badge>
        )}
      </Button>

      {isDropdownOpen && <NotificationsDropdown />}
    </div>
  );
}
