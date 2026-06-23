"use client";

import {
  Clock,
  Star,
  MessageCircle,
  DollarSign,
  FileText,
  Frown,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { DisputeCategory } from "@hassad/shared";
import { DISPUTE_CATEGORY_AR } from "@hassad/shared";

const CATEGORY_ICONS: Record<DisputeCategory, LucideIcon> = {
  DELAY: Clock,
  QUALITY: Star,
  COMMUNICATION: MessageCircle,
  BUDGET: DollarSign,
  SCOPE: FileText,
  ATTITUDE: Frown,
  OTHER: HelpCircle,
};

const CATEGORY_STYLES: Record<DisputeCategory, { bg: string; icon: string }> = {
  DELAY: { bg: "bg-orange-50", icon: "text-orange-500" },
  QUALITY: { bg: "bg-amber-50", icon: "text-amber-500" },
  COMMUNICATION: { bg: "bg-blue-50", icon: "text-blue-500" },
  BUDGET: { bg: "bg-green-50", icon: "text-green-500" },
  SCOPE: { bg: "bg-purple-50", icon: "text-purple-500" },
  ATTITUDE: { bg: "bg-red-50", icon: "text-red-500" },
  OTHER: { bg: "bg-gray-50", icon: "text-gray-500" },
};

interface DisputeCategoryIconProps {
  category: DisputeCategory;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { container: "h-6 w-6", icon: "h-3 w-3", text: "text-xs" },
  md: { container: "h-8 w-8", icon: "h-4 w-4", text: "text-sm" },
  lg: { container: "h-10 w-10", icon: "h-5 w-5", text: "text-base" },
};

export function DisputeCategoryIcon({
  category,
  showLabel = false,
  size = "md",
}: DisputeCategoryIconProps) {
  const Icon = CATEGORY_ICONS[category];
  const styles = CATEGORY_STYLES[category];
  const sizeClasses = SIZE_MAP[size];

  return (
    <div className="flex items-center gap-2" dir="rtl">
      <div
        className={`flex ${sizeClasses.container} items-center justify-center rounded-full ${styles.bg}`}
      >
        <Icon className={`${sizeClasses.icon} ${styles.icon}`} />
      </div>
      {showLabel && (
        <span className={`${sizeClasses.text} font-medium text-natural-100`}>
          {DISPUTE_CATEGORY_AR[category]}
        </span>
      )}
    </div>
  );
}
