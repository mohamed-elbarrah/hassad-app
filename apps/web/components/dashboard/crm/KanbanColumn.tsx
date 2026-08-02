"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RequestStatus } from "@hassad/shared";
import type { RequestItem } from "@/features/requests/requestsApi";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  stage: RequestStatus;
  label: string;
  theme: {
    dotClass: string;
    bandClass: string;
    surfaceClass: string;
    countClass: string;
  };
  clients: RequestItem[];
  onCreateProposal?: (request: RequestItem) => void;
  onEditProposal?: (request: RequestItem) => void;
  onCreateContract?: (request: RequestItem) => void;
  onEditContract?: (request: RequestItem) => void;
}

export function KanbanColumn({
  stage,
  label,
  theme,
  clients,
  onCreateProposal,
  onEditProposal,
  onCreateContract,
  onEditContract,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "w-full flex flex-col overflow-hidden transition-all duration-150",
        isOver && "ring-2 ring-secondary-500/30 ring-offset-2 scale-[1.01]",
      )}
    >
      <div
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-3",
          theme.bandClass,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "h-3 w-3 shrink-0 rounded-full ring-2 ring-background",
              theme.dotClass,
            )}
          />
          <h3 className="truncate text-xs font-semibold text-foreground">
            {label}
          </h3>
        </div>
        <Badge
          variant="secondary"
          className={cn("shrink-0 tabular-nums", theme.countClass)}
        >
          {clients.length}
        </Badge>
      </div>

      <CardContent
        className={cn("flex min-h-20 flex-1 flex-col gap-2 p-2", theme.surfaceClass)}
      >
        {clients.map((client) => (
          <KanbanCard
            key={client.id}
            client={client}
            onCreateProposal={onCreateProposal}
            onEditProposal={onEditProposal}
            onCreateContract={onCreateContract}
            onEditContract={onEditContract}
          />
        ))}
        {clients.length === 0 && (
          <div className="flex min-h-16 flex-1 items-center justify-center">
            <p className="select-none text-center text-xs text-muted-foreground">
              لا يوجد عملاء
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
