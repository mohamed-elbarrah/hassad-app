"use client";

import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toggleDropdown, setDropdownOpen } from "@/features/notifications/notificationsSlice";
import { useGetUnreadCountQuery } from "@/features/portal-notifications/portalNotificationsApi";
import { PortalNotificationsDropdown } from "./PortalNotificationsDropdown";

export function PortalNotificationBell() {
  const dispatch = useAppDispatch();
  const { isDropdownOpen } = useAppSelector(
    (state) => state.notifications,
  );

  const { data } = useGetUnreadCountQuery(undefined, { pollingInterval: 30000 });
  const unreadCount = data?.count ?? 0;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node) && isDropdownOpen) {
        dispatch(setDropdownOpen(false));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dispatch, isDropdownOpen]);

  const displayCount =
    unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div ref={ref} className="relative">
      <button
        className="relative flex items-center justify-center shrink-0 bg-white"
        style={{
          width: 56,
          height: 56,
          border: "1.5px solid #E2E2E2",
          borderRadius: 9999,
        }}
        onClick={() => dispatch(toggleDropdown())}
        aria-label="الإشعارات"
      >
        <Bell style={{ width: 24, height: 24, color: "#000000" }} />
        {displayCount !== null && (
          <span
            className="absolute flex items-center justify-center text-white font-semibold"
            style={{
              width: 27,
              height: 27,
              background: "#FB3748",
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 600,
              lineHeight: "21px",
              top: -3,
              right: -3,
              border: "2px solid #fff",
            }}
          >
            {displayCount}
          </span>
        )}
      </button>

      {isDropdownOpen && <PortalNotificationsDropdown />}
    </div>
  );
}
