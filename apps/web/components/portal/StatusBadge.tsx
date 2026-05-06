import { CheckCircle2, Clock, Hourglass, RotateCcw, PauseCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType = "completed" | "in-progress" | "not-started" | "pending" | "revision" | "active" | "on-hold" | "planning" | "cancelled";

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  completed: {
    label: "مكتمل",
    bg: "bg-badge-green-bg",
    text: "text-badge-green-text",
    icon: CheckCircle2,
  },
  "in-progress": {
    label: "جاري",
    bg: "bg-badge-yellow-bg",
    text: "text-badge-yellow-text",
    icon: Clock,
  },
  "not-started": {
    label: "لم يبدأ",
    bg: "bg-badge-gray-bg",
    text: "text-badge-gray-text",
    icon: Clock,
  },
  pending: {
    label: "قادمة",
    bg: "bg-badge-orange-bg",
    text: "text-badge-orange-text",
    icon: Hourglass,
  },
  revision: {
    label: "تعديل",
    bg: "bg-danger-100/10",
    text: "text-danger-500",
    icon: RotateCcw,
  },
  active: {
    label: "نشط",
    bg: "bg-badge-green-bg",
    text: "text-badge-green-text",
    icon: CheckCircle2,
  },
  "on-hold": {
    label: "معلق",
    bg: "bg-badge-yellow-bg",
    text: "text-badge-yellow-text",
    icon: PauseCircle,
  },
  planning: {
    label: "تخطيط",
    bg: "bg-badge-gray-bg",
    text: "text-badge-gray-text",
    icon: Clock,
  },
  cancelled: {
    label: "ملغى",
    bg: "bg-danger-100/10",
    text: "text-danger-500",
    icon: XCircle,
  },
};

export function StatusBadge({
  status,
  label,
}: {
  status: StatusType;
  label?: string;
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[16px] font-medium leading-[24px]",
        config.bg,
        config.text
      )}
    >
      {label ?? config.label}
      <Icon className="w-5 h-5" />
    </span>
  );
}
