import type { LucideIcon } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

/** Generic "nothing here yet" panel used by the per-period tabs. */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <SurfaceCard>
      <div className="flex flex-col items-center gap-3 py-16 text-center text-portal-note-text">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
          <Icon className="size-8 text-portal-icon" />
        </div>
        <p className="text-lg font-medium text-natural-100">{title}</p>
        {description && <p className="text-sm">{description}</p>}
      </div>
    </SurfaceCard>
  );
}