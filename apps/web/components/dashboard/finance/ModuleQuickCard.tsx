"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

interface Props {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  badgeColor?: "danger" | "alert" | "success" | "secondary";
  description: string;
  meta?: Array<{
    label: string;
    value: string | number;
    accent?: "danger" | "alert" | "success" | "neutral";
  }>;
  progress?: number;
  progressLabel?: string;
  tint?: "blue" | "amber" | "rose" | "slate";
  className?: string;
}

const tintMap = {
  blue: {
    iconBg: "bg-action-blue-soft",
    iconText: "text-action-blue",
    bar: "bg-action-blue",
    barTrack: "bg-action-blue-soft",
    badge: "bg-action-blue-soft text-action-blue",
  },
  amber: {
    iconBg: "bg-alert-100/50",
    iconText: "text-alert-500",
    bar: "bg-alert-500",
    barTrack: "bg-alert-100",
    badge: "bg-alert-100/50 text-alert-500",
  },
  rose: {
    iconBg: "bg-danger-100",
    iconText: "text-danger-500",
    bar: "bg-danger-500",
    barTrack: "bg-danger-100",
    badge: "bg-danger-100 text-danger-500",
  },
  slate: {
    iconBg: "bg-badge-gray-bg",
    iconText: "text-portal-icon",
    bar: "bg-portal-icon",
    barTrack: "bg-secondary-100",
    badge: "bg-badge-gray-bg text-portal-icon",
  },
};

const metaAccentMap = {
  danger: "text-danger-500",
  alert: "text-alert-500",
  success: "text-success-500",
  neutral: "text-portal-note-text",
};

export function ModuleQuickCard({
  title,
  href,
  icon: Icon,
  badge,
  tint = "blue",
  description,
  meta,
  progress,
  progressLabel,
  className,
}: Props) {
  const colors = tintMap[tint];

  return (
    <Link href={href} className={cn("block h-full", className)}>
      <div
        className={cn(
          "h-full rounded-card border border-border-default bg-surface",
          "shadow-sm hover:shadow-lg hover:border-secondary-200",
          "hover:-translate-y-1 transition-all duration-300",
          "group cursor-pointer flex flex-col p-5",
        )}
      >
        {/* ── Top strip: icon + badge + arrow ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                "transition-colors duration-300",
                colors.iconBg,
                colors.iconText,
                "group-hover:scale-105",
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            {badge !== undefined && Number(badge) > 0 && (
              <span
                className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-lg",
                  colors.badge,
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <ChevronLeft className="w-4 h-4 text-portal-note-text group-hover:text-secondary-500 transition-colors" />
        </div>

        {/* ── Title block ── */}
        <div className="mt-3">
          <h3 className="text-[15px] font-bold text-natural-100 leading-tight">
            {title}
          </h3>
          <p className="text-[11px] text-portal-note-text mt-0.5 leading-snug">
            {description}
          </p>
        </div>

        {/* ── Meta micro-row ── */}
        {meta && meta.length > 0 && (
          <div className="mt-2.5 flex items-center gap-3 flex-wrap">
            {meta.map((m, i) => (
              <span key={i} className="text-[11px]">
                <span
                  className={cn(
                    "font-bold",
                    metaAccentMap[m.accent || "neutral"],
                  )}
                >
                  {m.value}
                </span>
                <span className="text-portal-note-text mr-1">{m.label}</span>
                {i < meta.length - 1 && (
                  <span className="text-portal-divider ml-2">·</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* ── Bottom progress ── */}
        {progress !== undefined && (
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-portal-note-text">{progressLabel}</span>
              <span className="font-bold text-natural-100">
                {Math.round(progress)}%
              </span>
            </div>
            <div
              className={cn(
                "h-1.5 rounded-full overflow-hidden",
                colors.barTrack,
              )}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  colors.bar,
                )}
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
