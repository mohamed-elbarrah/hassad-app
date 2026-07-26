"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { MoreMenu } from "./MoreMenu";
import {
  PORTAL_BOTTOM_PRIMARY,
  isPortalActiveLink,
} from "@/lib/portal-navigation";

/* ── Bottom Navigation Bar (Mobile + Tablet) ──────────────────────────── */
export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = useMemo(() => {
    const primaryHrefs = PORTAL_BOTTOM_PRIMARY.map((i) => i.href);
    return !primaryHrefs.some((h) => isPortalActiveLink(h, pathname));
  }, [pathname]);

  const toggleMore = () => setMoreOpen((v) => !v);

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 right-0 left-0 z-40 bg-white border-t border-border-default px-2 pt-2 pb-4"
        style={{ borderTopWidth: 1.5 }}
      >
        <div className="flex items-center justify-around">
          {PORTAL_BOTTOM_PRIMARY.map((item) => {
            const Icon = item.icon;
            const active = isPortalActiveLink(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors",
                  active ? "text-brand" : "text-[var(--color-portal-nav-inactive)]",
                )}
              >
                <Icon
                  className="shrink-0"
                  style={{
                    width: 22,
                    height: 22,
                    color: active ? "var(--color-brand)" : "var(--color-portal-nav-inactive)",
                  }}
                />
                <span
                  className="text-xs font-medium"
                  style={{
                    color: active ? "var(--color-brand)" : "var(--color-portal-nav-inactive)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={toggleMore}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors",
              isMoreActive || moreOpen ? "text-brand" : "text-[var(--color-portal-nav-inactive)]",
            )}
          >
            <Menu
              className="shrink-0"
              style={{
                width: 22,
                height: 22,
                color: isMoreActive || moreOpen ? "var(--color-brand)" : "var(--color-portal-nav-inactive)",
              }}
            />
            <span
              className="text-xs font-medium"
              style={{
                color: isMoreActive || moreOpen ? "var(--color-brand)" : "var(--color-portal-nav-inactive)",
              }}
            >
              المزيد
            </span>
          </button>
        </div>
      </nav>

      <MoreMenu isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
