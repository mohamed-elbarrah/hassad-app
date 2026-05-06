import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card
      className={cn(
        "overflow-hidden border-[1.5px] border-portal-card-border rounded-[30px] bg-white shadow-none",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b-[1.5px] border-portal-divider space-y-0">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              className="w-[29px] h-[29px] text-portal-icon"
            />
          )}
          <h3 className="text-[24px] font-medium leading-[36px] text-natural-100">
            {title}
          </h3>
        </div>
        {showAll && (
          <Button
            variant="outline"
            onClick={onShowAll}
            className="h-auto text-[18px] font-medium leading-[27px] text-portal-icon border-[1.5px] border-portal-card-border rounded-[10px] px-5 py-2 hover:bg-neutral-100"
          >
            عرض الكل
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}
