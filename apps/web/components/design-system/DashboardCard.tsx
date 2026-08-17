import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { SurfaceCard } from "./SurfaceCard";
import { ActionButton } from "./ActionButton";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  icon?: LucideIcon;
  showAll?: boolean;
  onShowAll?: () => void;
  children: ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  icon: Icon,
  showAll = true,
  onShowAll,
  children,
  className = "",
}: DashboardCardProps) {
  return (
    <SurfaceCard
      title={title}
      icon={Icon}
      action={
        showAll && (
          <ActionButton
            variant="outline"
            size="md"
            className="text-[18px] font-medium text-portal-icon border-[1.5px] border-portal-card-border rounded-[10px] px-5 py-5"
            onClick={onShowAll}
          >
            عرض الكل
          </ActionButton>
        )
      }
      className={cn("shadow-none", className)}
    >
      {children}
    </SurfaceCard>
  );
}
