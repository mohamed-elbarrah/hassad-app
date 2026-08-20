"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface KanbanGroupProps {
  label: string;
  totalCount: number;
  children: React.ReactNode;
}

/**
 * Group wrapper used in the grouped layout (e.g. sales pipeline).
 *
 * Renders a rounded-2xl container with a header showing the group label
 * and total item count, and a scrollable body for the stage columns.
 */
export function KanbanGroup({ label, totalCount, children }: KanbanGroupProps) {
  return (
    <Card
      className="flex min-w-[280px] flex-1 flex-col overflow-hidden"
      dir="rtl"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-3">
        <CardTitle className="min-w-0 truncate text-sm font-semibold">
          {label}
        </CardTitle>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {totalCount}
        </Badge>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-2 p-2">{children}</CardContent>
    </Card>
  );
}
