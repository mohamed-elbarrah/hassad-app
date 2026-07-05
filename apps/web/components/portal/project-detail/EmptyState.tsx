import type { LucideIcon } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

/** Generic "nothing here yet" panel used by the per-period tabs. */
export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <SurfaceCard>
      <PortalEmptyState icon={icon} title={title} description={description} />
    </SurfaceCard>
  );
}
