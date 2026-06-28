"use client";

import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Loader2,
  RefreshCcw,
  type LucideIcon,
} from "lucide-react";

/**
 * Project-status visual mapping for the deliverables review queue.
 *
 *   AWAITING_REVIEW  → gold (brand-aligned, "your turn")
 *   NEEDS_REVISION   → red  (your attention, action needed)
 *   IN_REVIEW        → blue (mid-pipeline, not actionable)
 *   IN_PROGRESS      → gray (not actionable from client side)
 *   COMPLETED        → green
 *   anything else    → gray
 */
const STATUS_PRESET: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    ring: string;
    icon: LucideIcon;
  }
> = {
  AWAITING_REVIEW: {
    label: "بانتظار المراجعة",
    bg: "bg-primary-100",
    text: "text-primary-700",
    ring: "ring-primary-200/70",
    icon: Clock,
  },
  NEEDS_REVISION: {
    label: "مطلوب تعديلات",
    bg: "bg-danger-100",
    text: "text-danger-700",
    ring: "ring-danger-200/70",
    icon: RefreshCcw,
  },
  IN_REVIEW: {
    label: "قيد المراجعة",
    bg: "bg-action-blue-soft",
    text: "text-action-blue",
    ring: "ring-action-blue/15",
    icon: Eye,
  },
  IN_PROGRESS: {
    label: "قيد التنفيذ",
    bg: "bg-badge-gray-bg",
    text: "text-secondary-500",
    ring: "ring-portal-card-border",
    icon: Loader2,
  },
  COMPLETED: {
    label: "مكتمل",
    bg: "bg-success-100",
    text: "text-success-700",
    ring: "ring-success-200/70",
    icon: CheckCircle2,
  },
  ACTIVE: {
    label: "نشط",
    bg: "bg-success-100",
    text: "text-success-700",
    ring: "ring-success-200/70",
    icon: CheckCircle2,
  },
  ON_HOLD: {
    label: "معلق",
    bg: "bg-badge-gray-bg",
    text: "text-secondary-500",
    ring: "ring-portal-card-border",
    icon: Circle,
  },
  CANCELLED: {
    label: "ملغي",
    bg: "bg-badge-gray-bg",
    text: "text-secondary-500",
    ring: "ring-portal-card-border",
    icon: Circle,
  },
  PLANNING: {
    label: "تخطيط",
    bg: "bg-badge-gray-bg",
    text: "text-secondary-500",
    ring: "ring-portal-card-border",
    icon: Circle,
  },
};

interface ProjectStatusPillProps {
  status: string;
  className?: string;
}

export function ProjectStatusPill({ status, className }: ProjectStatusPillProps) {
  const preset =
    STATUS_PRESET[status] ?? {
      label: status,
      bg: "bg-badge-gray-bg",
      text: "text-secondary-500",
      ring: "ring-portal-card-border",
      icon: Circle,
    };

  const Icon = preset.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-[11px] font-semibold whitespace-nowrap",
        "ring-1 ring-inset",
        preset.bg,
        preset.text,
        preset.ring,
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{preset.label}</span>
    </span>
  );
}
