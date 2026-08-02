"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface KanbanGroupProps {
  id: string;
  label: string;
  totalCount: number;
  children: React.ReactNode;
}

export function KanbanGroup({ label, totalCount, children }: KanbanGroupProps) {
  return (
    <Card
      className={cn(
        "flex min-w-[340px] flex-1 flex-col overflow-hidden",
      )}
      dir="rtl"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4">
        <CardTitle className="min-w-0 truncate text-sm font-semibold">
          {label}
        </CardTitle>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {totalCount}
        </Badge>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-1 flex-col gap-3 p-3">
        {children}
      </CardContent>
    </Card>
  );
}
