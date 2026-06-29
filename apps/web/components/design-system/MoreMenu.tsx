"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PORTAL_MORE_ITEMS,
  isPortalActiveLink,
} from "@/lib/portal-navigation";

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const pathname = usePathname();

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", onEsc);
    }
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      {/* panel */}
      <div
        className="fixed bottom-0 right-0 left-0 z-50 rounded-t-[30px] border-t-[1.5px] border-portal-card-border bg-natural-0 p-6"
        style={{ maxHeight: "70vh" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-natural-100">المزيد</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-badge-gray-bg hover:bg-portal-divider transition-colors"
          >
            <X className="h-5 w-5 text-secondary-500" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PORTAL_MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isPortalActiveLink(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3 transition-colors",
                  isActive
                    ? "border-secondary-500 bg-badge-gray-bg text-secondary-500 font-bold"
                    : "border-portal-card-border bg-portal-bg text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500",
                )}
              >
                <Icon className="shrink-0" style={{ width: 22, height: 22 }} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
