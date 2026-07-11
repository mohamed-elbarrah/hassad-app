"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings, ChevronDown, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { logout } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import { UserRole } from "@hassad/shared";
import {
  adminNavSections,
  roleNavSections,
} from "@/lib/navigation";
import { UserInfoCard } from "./UserAvatar";

function isActiveLink(href: string, pathname: string) {
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
  return pathname === href || pathname.startsWith(href + "/");
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [logoutMutation] = useLogoutMutation();

  const processedSections = useMemo(() => {
    if (!user) return [];
    const role = user.role;
    const isAdmin = role === UserRole.ADMIN;
    const sections = isAdmin ? adminNavSections : roleNavSections;
    const seen = new Set<string>();

    return sections
      .map((section) => ({
        label: section.label,
        items: section.items
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
          })
          .filter((item) => {
            if (seen.has(item.url)) return false;
            seen.add(item.url);
            return true;
          }),
      }))
      .filter((section) => section.items.length > 0);
  }, [user]);

  const { standaloneItems, groupedSections } = useMemo(() => {
    if (processedSections.length === 0) {
      return { standaloneItems: [], groupedSections: [] };
    }
    const [first, ...rest] = processedSections;
    return { standaloneItems: first.items, groupedSections: rest };
  }, [processedSections]);

  const activeGroupLabel = useMemo(() => {
    for (const section of groupedSections) {
      if (section.items.some((item) => isActiveLink(item.url, pathname))) {
        return section.label;
      }
    }
    return null;
  }, [groupedSections, pathname]);

  const [openGroup, setOpenGroup] = useState<string | null>(activeGroupLabel);

  const toggleGroup = useCallback((label: string) => {
    setOpenGroup((current) => (current === label ? null : label));
  }, []);

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
      <div className="flex items-center justify-center py-6">
        <div className="flex flex-col items-center gap-1">
          <Image src="/masar.svg" alt="Logo" width={100} height={100} />
        </div>
      </div>

      <nav className="flex-1 px-8 pt-6 space-y-1 overflow-y-auto">
        {standaloneItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveLink(item.url, pathname);
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(linkBase, isActive ? linkActive : linkInactive)}
              style={textStyle(isActive)}
            >
              <Icon className="shrink-0" style={iconStyle(isActive)} />
              <span>{item.title}</span>
            </Link>
          );
        })}

        {groupedSections.map((section) => {
          const isOpen = openGroup === section.label;
          const firstItem = section.items[0];
          const GroupIcon = firstItem?.icon;
          const hasActiveItem = section.items.some((item) =>
            isActiveLink(item.url, pathname),
          );

          return (
            <div key={section.label} className="space-y-1">
              <button
                type="button"
                className={cn(
                  linkBase,
                  "w-full justify-between",
                  hasActiveItem ? linkActive : linkInactive,
                )}
                style={textStyle(hasActiveItem)}
                onClick={() => toggleGroup(section.label)}
              >
                <div className="flex items-center gap-3">
                  {GroupIcon && (
                    <GroupIcon
                      className="shrink-0"
                      style={iconStyle(hasActiveItem)}
                    />
                  )}
                  <span>{section.label}</span>
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

              {isOpen && (
                <div className="mr-6 space-y-1 border-r-[1.5px] border-portal-card-border pr-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveLink(item.url, pathname);
                    return (
                      <Link
                        key={item.url}
                        href={item.url}
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
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-8 pb-6">
        <div className="my-4" style={{ borderTop: "1.5px solid #ECEEF2" }} />

        <Link
          href={settingsUrl}
          className={cn(
            linkBase,
            isActiveLink(settingsUrl, pathname) ? linkActive : linkInactive,
          )}
        >
          <Settings
            className="shrink-0"
            style={iconStyle(isActiveLink(settingsUrl, pathname))}
          />
          <span>الإعدادات</span>
        </Link>

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
