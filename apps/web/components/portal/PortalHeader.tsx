"use client";

import { Search, Moon, Bell } from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/* ── Component ──────────────────────────────────────────────────────────── */
export function PortalHeader() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header
      className="flex items-center justify-between px-6 shrink-0 bg-white"
      style={{
        height: 100,
        borderBottom: "1.5px solid #ECEEF2",
      }}
    >
      {/* ── Left side: Search + Actions ──────────────────────────── */}
      <div className="flex items-center gap-4">
        <Avatar
          className="rounded-full shrink-0"
          style={{
            width: 60,
            height: 60,
            border: "1.5px solid #E4E7EC",
          }}
        >
          <AvatarFallback
            className="rounded-full text-sm font-semibold"
            style={{ backgroundColor: "#121936", color: "#fff" }}
          >
            {user ? getInitials(user.name) : "--"}
          </AvatarFallback>
        </Avatar>
        <div className="text-right hidden md:block">
          <p
            style={{
              fontSize: 26,
              fontWeight: 600,
              lineHeight: "39px",
              color: "#000000",
            }}
          >
            مرحبًا {user?.name?.split(" ")[0] ?? ""}
          </p>
          <p
            style={{
              fontSize: 20,
              fontWeight: 400,
              lineHeight: "30px",
              color: "#525866",
            }}
          >
            مشروعك يسير بشكل جيد 🚀
          </p>
        </div>
      </div>

      {/* ── Right side: Welcome + Avatar ──────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Search — hidden on tablet & mobile */}
        <div
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
        </div>

        {/* Dark Mode Toggle */}
        <button
          className="flex items-center justify-center shrink-0 bg-white"
          style={{
            width: 56,
            height: 56,
            border: "1.5px solid #E2E2E2",
            borderRadius: 9999,
          }}
        >
          <Moon style={{ width: 24, height: 24, color: "#000000" }} />
        </button>

        {/* Notification Bell */}
        <button
          className="relative flex items-center justify-center shrink-0 bg-white"
          style={{
            width: 56,
            height: 56,
            border: "1.5px solid #E2E2E2",
            borderRadius: 9999,
          }}
        >
          <Bell style={{ width: 24, height: 24, color: "#000000" }} />
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
            1
          </span>
        </button>
      </div>
    </header>
  );
}
