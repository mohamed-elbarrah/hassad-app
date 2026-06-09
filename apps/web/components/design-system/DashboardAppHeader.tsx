"use client";

import { Search, Moon, Menu } from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import { DashboardNotificationBell } from "./DashboardNotificationBell";
import { UserHeaderDisplay } from "./UserAvatar";

interface DashboardAppHeaderProps {
  onMenuToggle?: () => void;
}

export function DashboardAppHeader({ onMenuToggle }: DashboardAppHeaderProps) {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header
      className="flex items-center justify-between px-6 shrink-0 bg-white"
      style={{
        height: 100,
        borderBottom: "1.5px solid #ECEEF2",
      }}
    >
      {/* Left side (RTL): User welcome + avatar */}
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden flex items-center justify-center shrink-0 bg-white cursor-pointer"
            style={{
              width: 48,
              height: 48,
              border: "1.5px solid #E2E2E2",
              borderRadius: 9999,
            }}
            aria-label="القائمة"
          >
            <Menu style={{ width: 24, height: 24, color: "#000000" }} />
          </button>
        )}
        {user && (
          <UserHeaderDisplay name={user.name} avatarUrl={user.avatarUrl} />
        )}
      </div>

      {/* Right side (RTL): Search + Dark mode + Notifications */}
      <div className="flex items-center gap-3">
        {/* Search */}
        {/* <div
          className="hidden lg:flex items-center gap-2 px-3 py-2 w-[373px]"
          style={{
            background: "#F9FAFB",
            border: "1px solid #E2E2E2",
            borderRadius: 16,
            height: 56,
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 41,
              height: 26,
              background: "rgba(0, 0, 0, 0.05)",
              borderRadius: 8,
            }}
          >
            <span
              className="text-sm"
              style={{
                color: "#000000",
                fontWeight: 400,
                fontSize: 14,
                lineHeight: "120%",
              }}
            >
              ⌘ K
            </span>
          </div>
          <input
            type="text"
            placeholder="أدخل كلمة البحث..."
            className="flex-1 bg-transparent text-sm outline-none text-right"
            style={{
              color: "rgba(0, 0, 0, 0.6)",
              fontSize: 16,
              fontWeight: 400,
              lineHeight: "164.9%",
            }}
            readOnly
          />
          <Search
            style={{ width: 24, height: 24, color: "rgba(0, 0, 0, 0.6)" }}
          />
        </div> */}

        {/* Dark Mode Toggle */}
        <button
          className="flex items-center justify-center shrink-0 bg-white cursor-pointer"
          style={{
            width: 56,
            height: 56,
            border: "1.5px solid #E2E2E2",
            borderRadius: 9999,
          }}
        >
          <Moon style={{ width: 24, height: 24, color: "#000000" }} />
        </button>

        <DashboardNotificationBell />
      </div>
    </header>
  );
}
