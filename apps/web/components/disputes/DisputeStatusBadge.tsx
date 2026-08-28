import { cn } from "@/lib/utils";
import type { DisputeStatus } from "@hassad/shared";
import { DISPUTE_STATUS_AR } from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
import { UNKNOWN_STATUS_LABEL } from "@/lib/i18n";

const STATUS_CLASSES: Record<DisputeStatus, string> = {
  PENDING_APPROVAL: "border-warning-200 bg-warning-100 text-warning-800",
  REJECTED: "border-neutral-200 bg-neutral-100 text-neutral-800",
  APPROVED: "border-info/20 bg-info/10 text-info",
  IN_PROGRESS: "border-info/20 bg-info/10 text-info",
  PENDING_CLIENT: "border-warning-200 bg-warning-100 text-warning-800",
  ESCALATED: "border-danger-200 bg-danger-100 text-danger-800",
  RESOLVED: "border-success-200 bg-success-100 text-success-800",
  CLOSED: "border-neutral-200 bg-neutral-100 text-neutral-800",
};

interface DisputeStatusBadgeProps {
  status: string;
  className?: string;
}

export function DisputeStatusBadge({
  status,
  className,
}: DisputeStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_CLASSES[status as DisputeStatus], className)}
      dir="rtl"
    >
      {DISPUTE_STATUS_AR[status as DisputeStatus] || UNKNOWN_STATUS_LABEL}
    </Badge>
  );
}
