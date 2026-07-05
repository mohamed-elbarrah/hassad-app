"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { logout } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import { UserRole } from "@hassad/shared";
import {
  navSections,
  adminNavSections,
  roleNavSections,
} from "@/lib/navigation";
import { UserInfoCard } from "./UserAvatar";

function isActiveLink(href: string, pathname: string) {
  // Role home pages: only active when exactly on that page
  const roleHomes = [
    "/dashboard/admin",
    "/dashboard/pm",
    "/dashboard/sales",
    "/dashboard/finance",
    "/dashboard/marketing",
    "/dashboard/employee",
    "/dashboard",
  ];
  if (roleHomes.includes(href)) {
    return pathname === href;
  }
  // Sub-pages: active when pathname matches exactly or is a child route
  return pathname === href || pathname.startsWith(href + "/");
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [logoutMutation] = useLogoutMutation();

  // Flatten visible nav items for the current user's role
  const visibleItems = useMemo(() => {
    if (!user) return [];
    const role = user.role;
    const isAdmin = role === UserRole.ADMIN;

    // Admin gets their own dedicated nav; everyone else gets role-specific
    const sections = isAdmin ? adminNavSections : roleNavSections;
    const seen = new Set<string>();

    return sections
      .flatMap((section) =>
        section.items
          .filter((item) => item.roles.includes(role))
          .flatMap((item) => {
            if (item.items && item.items.length > 0) {
              return item.items.map((sub) => ({
                title: sub.title,
                url: sub.url,
                icon: item.icon,
              }));
            }
            if (item.url) {
              return [{ title: item.title, url: item.url, icon: item.icon }];
            }
            return [];
          }),
      )
      .filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
  }, [user]);

  const settingsUrl =
    user?.role === UserRole.ADMIN
      ? "/dashboard/admin/settings"
      : "/dashboard/account";

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

  return (
    <aside
      className="h-screen bg-white flex flex-col shrink-0 sticky top-0 overflow-hidden"
      style={{
        width: 280,
        borderLeft: "1.5px solid #E1E4EA",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center py-6">
        <div className="flex flex-col items-center gap-1">
          <Image src="/masar.svg" alt="Logo" width={100} height={100} />
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav className="flex-1 px-4 pt-2 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveLink(item.url, pathname);
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(linkBase, isActive ? linkActive : linkInactive)}
            >
              <Icon
                className="shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  color: isActive ? "#121936" : "#A8ABB2",
                }}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ─────────────────────────────────────────── */}
      <div className="px-4 pb-6">
        <div className="my-4" style={{ borderTop: "1.5px solid #ECEEF2" }} />

        {/* Settings */}
        <Link
          href={settingsUrl}
          className={cn(
            linkBase,
            isActiveLink(settingsUrl, pathname) ? linkActive : linkInactive,
          )}
        >
          <Settings
            className="shrink-0"
            style={{
              width: 20,
              height: 20,
              color: isActiveLink(settingsUrl, pathname)
                ? "#121936"
                : "#A8ABB2",
            }}
          />
          <span>الإعدادات</span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            linkBase,
            "w-full text-right cursor-pointer hover:bg-danger-100",
          )}
          style={{ color: "#FF6161" }}
        >
          <LogOut
            className="shrink-0"
            style={{ width: 20, height: 20, color: "#FF6161" }}
          />
          <span>تسجيل الخروج</span>
        </button>

        {/* User Card */}
        {user && (
          <div className="mt-3 px-2">
            <UserInfoCard
              name={user.name}
              email={user.email}
              avatarUrl={user.avatarUrl}
              showVerified={true}
              size="md"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
