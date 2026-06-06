import { ReactNode } from "react";
import { PortalActionButton } from "./PortalActionButton";
import { cn } from "@/lib/utils";

interface ActionItemCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  primaryAction: string;
  secondaryAction: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryColor?: "purple" | "blue";
}

export function ActionItemCard({
  title,
  subtitle,
  icon,
  primaryAction,
  secondaryAction,
  onPrimary,
  onSecondary,
  primaryColor = "purple",
}: ActionItemCardProps) {
  return (
    <div className="p-5 bg-white space-y-4 border-[1.5px] border-portal-card-border rounded-[16px]">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center shrink-0 w-[64px] h-[64px] rounded-full bg-badge-gray-bg">
          {icon}
        </div>
        <div className="flex-1 text-right">
          <h4 className="text-[22px] font-medium leading-[33px] text-natural-100">
            {title}
          </h4>
          <p className="mt-1 text-[18px] font-normal leading-[27px] text-portal-note-text">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <PortalActionButton
          variant="outline"
          size="lg"
          onClick={onSecondary}
          className="flex-1 text-[16px] font-semibold text-action-gray-text border-[1.5px] border-portal-card-border rounded-[16px] hover:bg-neutral-100"
        >
          {secondaryAction}
        </PortalActionButton>
        <PortalActionButton
          variant={primaryColor === "purple" ? "action-purple" : "action-blue"}
          size="lg"
          onClick={onPrimary}
          className="flex-1 text-[16px] font-semibold text-white rounded-[16px]"
        >
          {primaryAction}
        </PortalActionButton>
      </div>
    </div>
  );
}
