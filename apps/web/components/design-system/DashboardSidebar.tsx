"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { logout } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import { UserRole } from "@hassad/shared";
import { navSections } from "@/lib/navigation";
import { UserInfoCard } from "./UserAvatar";

function isActiveLink(href: string, pathname: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
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
    return navSections.flatMap((section) =>
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
    );
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
        <div className="flex items-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-500 text-white shrink-0"
          >
            <Leaf className="h-5 w-5" />
          </div>
          <span
            className="text-xl font-bold"
            style={{ color: "#000000" }}
          >
            حصاد
          </span>
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
        <div
          className="my-4"
          style={{ borderTop: "1.5px solid #ECEEF2" }}
        />

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
