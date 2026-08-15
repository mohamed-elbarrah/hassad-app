import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/patterns/status-badge";

type MetricTileProps = {
  label: string;
  value: ReactNode;
  description: string;
  trend?: {
    label: string;
    tone: StatusTone;
  };
};

export function MetricTile({ label, value, description, trend }: MetricTileProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{description}</span>
        {trend && <StatusBadge tone={trend.tone}>{trend.label}</StatusBadge>}
      </CardContent>
    </Card>
  );
}
