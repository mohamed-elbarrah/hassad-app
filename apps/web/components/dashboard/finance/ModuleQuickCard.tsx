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
    iconBg: "bg-[#EFF6FF]",
    iconText: "text-[#3B82F6]",
    bar: "bg-[#3B82F6]",
    barTrack: "bg-[#DBEAFE]",
    badge: "bg-[#EFF6FF] text-[#3B82F6]",
  },
  amber: {
    iconBg: "bg-[#FFFBEB]",
    iconText: "text-[#F59E0B]",
    bar: "bg-[#F59E0B]",
    barTrack: "bg-[#FEF3C7]",
    badge: "bg-[#FFFBEB] text-[#F59E0B]",
  },
  rose: {
    iconBg: "bg-[#FFF1F2]",
    iconText: "text-[#F43F5E]",
    bar: "bg-[#F43F5E]",
    barTrack: "bg-[#FFE4E6]",
    badge: "bg-[#FFF1F2] text-[#F43F5E]",
  },
  slate: {
    iconBg: "bg-[#F8FAFC]",
    iconText: "text-[#64748B]",
    bar: "bg-[#64748B]",
    barTrack: "bg-[#E2E8F0]",
    badge: "bg-[#F8FAFC] text-[#64748B]",
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
          "h-full rounded-2xl border border-portal-card-border bg-natural-0",
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
