"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  CheckCircle2,
  PlusCircle,
  FolderOpen,
  Bell,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { logout } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/* ── Sidebar navigation items ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "الرئيسية", href: "/portal", icon: Home },
  { label: "الطلبات", href: "/portal/requests", icon: ClipboardList },
  { label: "المشاريع", href: "/portal/projects", icon: FolderOpen },
  { label: "الإشعارات", href: "/portal/notifications", icon: Bell },
  { label: "إجراءاتي", href: "/portal/actions", icon: CheckCircle2 },
  { label: "إنشاء طلب جديد", href: "/portal/new-order", icon: PlusCircle },
  { label: "التسليمات", href: "/portal/deliverables", icon: Inbox },
  { label: "العقود", href: "/portal/contracts", icon: FileText },
  { label: "الفواتير", href: "/portal/finance", icon: Receipt },
  { label: "الحملات", href: "/portal/campaigns", icon: BarChart3 },
];

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
export function PortalSidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [logoutMutation] = useLogoutMutation();

  async function handleLogout() {
    try {
      await logoutMutation().unwrap();
    } catch {
      // ignore
    }
    dispatch(logout());
    window.location.href = "/login";
  }

  return (
    <aside
      className="h-screen bg-white flex flex-col shrink-0 sticky top-0 overflow-hidden"
      style={{
        width: 336,
        borderLeft: "1.5px solid #E1E4EA",
      }}
    >
      {/* ── Logo ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center  pb-12">
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-[40px] font-bold tracking-tight"
            style={{
              color: "#e7be52",
              fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            }}
          >
            مسار
          </span>
          <span
            className="text-[10px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: "#525866" }}
          >
            MSAR
          </span>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="flex-1 px-8 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-badge-gray-bg text-[#121936] font-bold"
                  : "text-[#A8ABB2] hover:text-[#121936]",
              )}
              style={{
                fontSize: 20,
                fontWeight: isActive ? 700 : 500,
                lineHeight: "30px",
              }}
            >
              <Icon
                className="shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  color: isActive ? "#121936" : "#A8ABB2",
                }}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section: Settings + Logout + User ──────────────────── */}
      <div className="px-8 pb-6 space-y-2">
        {/* Settings */}
        <Link
          href="/portal/account"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
            pathname === "/portal/account" ||
              pathname.startsWith("/portal/account/")
              ? "bg-badge-gray-bg text-[#121936]"
              : "text-[#A8ABB2] hover:text-[#121936]",
          )}
          style={{ fontSize: 20, fontWeight: 500, lineHeight: "30px" }}
        >
          <Settings
            className="shrink-0"
            style={{
              width: 20,
              height: 20,
              color:
                pathname === "/portal/account" ||
                pathname.startsWith("/portal/account/")
                  ? "#121936"
                  : "#A8ABB2",
            }}
          />
          <span>الاعدادات</span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{
            color: "#FF6161",
            fontSize: 20,
            fontWeight: 500,
            lineHeight: "30px",
          }}
        >
          <LogOut
            className="shrink-0"
            style={{ width: 20, height: 20, color: "#FF6161" }}
          />
          <span>تسجيل الخروج</span>
        </button>

        {/* Divider */}
        <div className="my-4" style={{ borderTop: "1.5px solid #ECEEF2" }} />

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 py-2">
            <Avatar
              className="shrink-0 rounded-full"
              style={{ width: 60, height: 60 }}
            >
              <AvatarFallback
                className="rounded-full text-sm font-semibold"
                style={{ backgroundColor: "#121936", color: "#fff" }}
              >
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center  gap-1.5">
                <span
                  className="truncate font-semibold"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    lineHeight: "33px",
                    color: "#000000",
                  }}
                >
                  {user.name}
                </span>
                <CheckCircle2
                  style={{ width: 22, height: 22, color: "#00AEFF" }}
                  className="shrink-0"
                />
              </div>
              <p
                className="truncate mt-0.5"
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "24px",
                  color: "rgba(0, 0, 0, 0.6)",
                }}
              >
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
