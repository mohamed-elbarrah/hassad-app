"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { logout } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import { UserMenu } from "./UserMenu";
import Image from "next/image";
import {
  PORTAL_STANDALONE_ITEMS,
  PORTAL_NAV_GROUPS,
  isPortalActiveLink,
} from "@/lib/portal-navigation";

/* ── Component ────────────────────────────────────────────────────────── */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [logoutMutation] = useLogoutMutation();

  const activeGroupKey = useMemo(() => {
    for (const group of PORTAL_NAV_GROUPS) {
      if (group.items.some((item) => isPortalActiveLink(item.href, pathname))) {
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
  const linkActive = "bg-badge-gray-bg text-brand font-bold";
  const linkInactive = "text-portal-nav-inactive hover:text-brand";

  const iconStyle = (active: boolean) => ({
    width: 20,
    height: 20,
    color: active ? "var(--color-brand)" : "var(--color-portal-nav-inactive)",
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
        borderLeft: "1.5px solid var(--color-border-default)",
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
        {PORTAL_STANDALONE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isPortalActiveLink(item.href, pathname);
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
        {PORTAL_NAV_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = openGroup === group.key;
          const hasActiveItem = group.items.some((item) =>
            isPortalActiveLink(item.href, pathname),
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
                      color: hasActiveItem ? "var(--color-brand)" : "var(--color-portal-nav-inactive)",
                    }}
                  />
                ) : (
                  <ChevronLeft
                    className="shrink-0"
                    style={{
                      width: 20,
                      height: 20,
                      color: hasActiveItem ? "var(--color-brand)" : "var(--color-portal-nav-inactive)",
                    }}
                  />
                )}
              </button>

              {/* Group items (only if open) */}
              {isOpen && (
                <div className="mr-6 space-y-1 border-r-[1.5px] border-portal-card-border pr-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isPortalActiveLink(item.href, pathname);
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
        <div className="my-4" style={{ borderTop: "1.5px solid var(--color-border-subtle)" }} />

        {user && <UserMenu user={user} onLogout={handleLogout} />}
      </div>
    </aside>
  );
}
