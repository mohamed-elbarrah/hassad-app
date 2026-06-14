"use client";

import { useDroppable } from "@dnd-kit/core";
import { RequestStatus } from "@hassad/shared";
import type { RequestItem } from "@/features/requests/requestsApi";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  stage: RequestStatus;
  label: string;
  theme: {
    dot: string;
    bandBg: string;
    surfaceBg: string;
    cardBorder: string;
    countText: string;
    countBg: string;
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
    <div
      ref={setNodeRef}
      className={cn(
        "w-full rounded-xl flex flex-col transition-all duration-150",
        isOver && "ring-2 ring-secondary-500/30 ring-offset-2 scale-[1.01]",
      )}
    >
      {/* ── Tinted Header Band ───────────────────────────────────────── */}
      <div
        className="flex w-full rounded-t-lg items-center gap-2 justify-between px-2 py-2.5 "
        style={{ backgroundColor: theme.bandBg }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white"
            style={{ backgroundColor: theme.dot }}
          />
          <h3
            className="text-xs font-bold truncate"
            style={{ color: "#121936" }}
          >
            {label}
          </h3>
        </div>
        <span
          className="text-xs font-bold rounded-full shrink-0 tabular-nums"
          style={{
            backgroundColor: theme.countBg,
            color: theme.countText,
            padding: "2px 8px",
            minWidth: 24,
            height: 20,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {clients.length}
        </span>
      </div>

      {/* ── Cards Area with tinted surface + top accent border ───────── */}
      <div
        className="flex flex-col gap-2 rounded-b-lg min-h-20 flex-1  p-2"
        style={{
          backgroundColor: theme.surfaceBg,
          borderTopColor: theme.dot,
        }}
      >
        {clients.map((client) => (
          <KanbanCard
            key={client.id}
            client={client}
            accentColor={theme.cardBorder}
            onCreateProposal={onCreateProposal}
            onEditProposal={onEditProposal}
            onCreateContract={onCreateContract}
            onEditContract={onEditContract}
          />
        ))}
        {clients.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-16">
            <p
              className="text-xs text-center select-none"
              style={{ color: "#A8ABB2" }}
            >
              لا يوجد عملاء
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
