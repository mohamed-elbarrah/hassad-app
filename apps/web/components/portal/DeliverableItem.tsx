"use client";

import { Calendar } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface DeliverableItemProps {
  title: string;
  description: string;
  date: string;
  status: "completed" | "in-progress" | "not-started" | "pending";
  statusLabel?: string;
}

/* ── Deliverable / Invoice List Item ────────────────────────────────────
   Exact from source:
   - Card: width 416px, border 1.5px solid #E1E4EA, radius 16px, bg #FFFFFF
   - Title: 22px weight 500 #000000
   - Description: 18px weight 400 rgba(0,0,0,0.6)
   - Date: 16px weight 400 #585D5B with Calendar icon
   - Badge: as per StatusBadge component
─────────────────────────────────────────────────────────────────────────── */
export function DeliverableItem({
  title,
  description,
  date,
  status,
  statusLabel,
}: DeliverableItemProps) {
  return (
    <div
      className="p-5 bg-white space-y-3"
      style={{
        border: "1.5px solid #E1E4EA",
        borderRadius: 16,
      }}
    >
      <div className="text-right">
        <h4
          style={{
            fontSize: 22,
            fontWeight: 500,
            lineHeight: "33px",
            color: "#000000",
          }}
        >
          {title}
        </h4>
        <p
          className="mt-1"
          style={{
            fontSize: 18,
            fontWeight: 400,
            lineHeight: "27px",
            color: "rgba(0, 0, 0, 0.6)",
          }}
        >
          {description}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-1"
          style={{
            fontSize: 16,
            fontWeight: 400,
            lineHeight: "24px",
            color: "#585D5B",
          }}
        >
          <Calendar style={{ width: 13, height: 14, color: "#474747" }} />
          <span>{date}</span>
        </div>
        <StatusBadge status={status} label={statusLabel} />
      </div>
    </div>
  );
}
