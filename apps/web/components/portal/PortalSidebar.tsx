"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  MessageSquare,
  ChevronDown,
  ChevronLeft,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { logout } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import { UserInfoCard } from "./UserAvatar";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ── Navigation groups ─────────────────────────────────────────────────── */
const STANDALONE_ITEMS = [{ label: "الرئيسية", href: "/portal", icon: Home }];

interface NavGroup {
  key: string;
  label: string;
  icon: typeof Home;
  items: { label: string; href: string; icon: typeof Home }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: "orders",
    label: "الطلبات والمشاريع",
    icon: ClipboardList,
    items: [
      { label: "الطلبات", href: "/portal/requests", icon: ClipboardList },
      { label: "المشاريع", href: "/portal/projects", icon: FolderOpen },
      { label: "إنشاء طلب جديد", href: "/portal/new-order", icon: PlusCircle },
    ],
  },
  {
    key: "communication",
    label: "التواصل",
    icon: MessageSquare,
    items: [
      { label: "المحادثات", href: "/portal/chat", icon: MessageSquare },
      { label: "الإشعارات", href: "/portal/notifications", icon: Bell },
      { label: "إجراءاتي", href: "/portal/actions", icon: CheckCircle2 },
    ],
  },
  {
    key: "documents",
    label: "المستندات",
    icon: FileText,
    items: [
      { label: "العقود", href: "/portal/contracts", icon: FileText },
      { label: "العروض الفنية", href: "/portal/proposals", icon: FileText },
      { label: "مراجعة التسليمات", href: "/portal/deliverables", icon: Inbox },
    ],
  },
  {
    key: "finance",
    label: "المالية والتسويق",
    icon: Receipt,
    items: [
      { label: "الفواتير والمدفوعات", href: "/portal/finance", icon: Receipt },
      {
        label: "الحملات الإعلانية",
        href: "/portal/campaigns",
        icon: TrendingUp,
      },
      { label: "التقارير", href: "/portal/reports", icon: BarChart3 },
    ],
  },
];

function isActiveLink(href: string, pathname: string) {
  if (href === "/portal") {
    return pathname === "/portal";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

/* ── Component ────────────────────────────────────────────────────────── */
export function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [logoutMutation] = useLogoutMutation();

  /* Determine which group (if any) contains the active page */
  const activeGroupKey = useMemo(() => {
    for (const group of NAV_GROUPS) {
      if (group.items.some((item) => isActiveLink(item.href, pathname))) {
        return group.key;
      }
    }
    return null;
  }, [pathname]);

  const [openGroup, setOpenGroup] = useState<string | null>(activeGroupKey);

  const toggleGroup = useCallback((key: string) => {
    setOpenGroup((current) => (current === key ? null : key));
  }, []);

  async function handleLogout() {
    try {
      await logoutMutation().unwrap();
    } catch {
      // ignore
    }
    dispatch(logout());
    window.location.href = "/login";
  }

  const linkBase =
    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors";
  const linkActive = "bg-badge-gray-bg text-[#121936] font-bold";
  const linkInactive = "text-[#A8ABB2] hover:text-[#121936]";

  const iconStyle = (active: boolean) => ({
    width: 20,
    height: 20,
    color: active ? "#121936" : "#A8ABB2",
  });

  const textStyle = (active: boolean) => ({
    fontSize: 20,
    fontWeight: active ? 700 : 500,
    lineHeight: "30px",
  });

  return (
    <aside
      className="h-screen bg-white flex flex-col shrink-0 sticky top-0 overflow-hidden"
      style={{
        width: 336,
        borderLeft: "1.5px solid #E1E4EA",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center  py-6">
        <div className="flex flex-col items-center gap-1">
          <Image src="/masar.svg" alt="Logo" width={100} height={100} />
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav className="flex-1 px-8 pt-6 space-y-1 overflow-y-auto">
        {/* Standalone items (always visible) */}
        {STANDALONE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveLink(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(linkBase, isActive ? linkActive : linkInactive)}
              style={textStyle(isActive)}
            >
              <Icon className="shrink-0" style={iconStyle(isActive)} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Accordion groups */}
        {NAV_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = openGroup === group.key;
          const hasActiveItem = group.items.some((item) =>
            isActiveLink(item.href, pathname),
          );

          return (
            <div key={group.key} className="space-y-1">
              {/* Group header (toggle) */}
              <button
                type="button"
                className={cn(
                  linkBase,
                  "w-full justify-between",
                  hasActiveItem ? linkActive : linkInactive,
                )}
                style={textStyle(hasActiveItem)}
                onClick={() => toggleGroup(group.key)}
              >
                <div className="flex items-center gap-3">
                  <GroupIcon
                    className="shrink-0"
                    style={iconStyle(hasActiveItem)}
                  />
                  <span>{group.label}</span>
                </div>
                {isOpen ? (
                  <ChevronDown
                    className="shrink-0"
                    style={{
                      width: 20,
                      height: 20,
                      color: hasActiveItem ? "#121936" : "#A8ABB2",
                    }}
                  />
                ) : (
                  <ChevronLeft
                    className="shrink-0"
                    style={{
                      width: 20,
                      height: 20,
                      color: hasActiveItem ? "#121936" : "#A8ABB2",
                    }}
                  />
                )}
              </button>

              {/* Group items (only if open) */}
              {isOpen && (
                <div className="mr-6 space-y-1 border-r-[1.5px] border-portal-card-border pr-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveLink(item.href, pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          linkBase,
                          isActive ? linkActive : linkInactive,
                        )}
                        style={textStyle(isActive)}
                      >
                        <Icon
                          className="shrink-0"
                          style={iconStyle(isActive)}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom section ─────────────────────────────────────────── */}
      <div className="px-8 pb-6">
        <div className="my-4" style={{ borderTop: "1.5px solid #ECEEF2" }} />

        {/* User card with dropdown */}
        {user && (
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <button className="w-full text-right cursor-pointer focus:outline-none focus:ring-0">
                <UserInfoCard
                  name={user.name}
                  email={user.email}
                  avatarUrl={user.avatarUrl}
                  showVerified={true}
                  size="lg"
                  className="py-2"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={8}
              style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}
              className="rounded-xl p-2"
            >
              <DropdownMenuItem
                className=" rounded-lg py-3 px-3 cursor-pointer text-base"
                onClick={() => router.push("/portal/account")}
              >
                <Settings className=" text-gray-600" />
                <span className="text-gray-600 font-medium transition-colors">الاعدادات</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-lg py-3 px-3 cursor-pointer text-base"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" style={{ color: "#FF6161" }} />
                <span className="text-red-400 font-medium transition-colors">تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
}
