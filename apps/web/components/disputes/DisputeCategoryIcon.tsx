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
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<DisputeCategory, LucideIcon> = {
  DELAY: Clock,
  QUALITY: Star,
  COMMUNICATION: MessageCircle,
  BUDGET: DollarSign,
  SCOPE: FileText,
  ATTITUDE: Frown,
  OTHER: HelpCircle,
};

const CATEGORY_STYLES: Record<DisputeCategory, { container: string; icon: string }> = {
  DELAY: { container: "bg-warning-100", icon: "text-warning-600" },
  QUALITY: { container: "bg-warning-100", icon: "text-warning-600" },
  COMMUNICATION: { container: "bg-info/10", icon: "text-info" },
  BUDGET: { container: "bg-success-100", icon: "text-success-600" },
  SCOPE: { container: "bg-info/10", icon: "text-info" },
  ATTITUDE: { container: "bg-danger-100", icon: "text-danger-600" },
  OTHER: { container: "bg-neutral-100", icon: "text-neutral-800" },
};

interface DisputeCategoryIconProps {
  category: DisputeCategory;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { container: "size-6", icon: "size-3", text: "text-xs" },
  md: { container: "size-8", icon: "size-4", text: "text-sm" },
  lg: { container: "size-10", icon: "size-5", text: "text-base" },
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
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          sizeClasses.container,
          styles.container,
        )}
      >
        <Icon aria-hidden="true" className={cn(sizeClasses.icon, styles.icon)} />
      </div>
      {showLabel && (
        <span className={cn(sizeClasses.text, "font-medium text-foreground")}>
          {DISPUTE_CATEGORY_AR[category]}
        </span>
      )}
    </div>
  );
}
