"use client";

import { Calendar } from "lucide-react";

interface TimelineItemProps {
  date: string;
  text: string;
  icon: React.ReactNode;
}

/* ── Timeline / Update Item ─────────────────────────────────────────────
   Exact from source:
   - Card: width 416px, border 1.5px solid #E1E4EA, radius 16px, bg #FFFFFF
   - Date: 18px weight 400 rgba(0,0,0,0.6), with Calendar icon
   - Text: 22px weight 500 #000000
   - Icon circle: 64x64, bg rgba(18,25,54,0.05)
─────────────────────────────────────────────────────────────────────────── */
export function TimelineItem({ date, text, icon }: TimelineItemProps) {
  return (
    <div
      className="flex items-center gap-4 p-5 bg-white"
      style={{
        border: "1.5px solid #E1E4EA",
        borderRadius: 16,
      }}
    >
      <div className="flex-1 text-right">
        <p
          className="flex items-center justify-end gap-1.5"
          style={{
            fontSize: 18,
            fontWeight: 400,
            lineHeight: "27px",
            color: "rgba(0, 0, 0, 0.6)",
          }}
        >
          {date}
          <Calendar style={{ width: 13, height: 14, color: "#474747" }} />
        </p>
        <p
          className="mt-1"
          style={{
            fontSize: 22,
            fontWeight: 500,
            lineHeight: "33px",
            color: "#000000",
          }}
        >
          {text}
        </p>
      </div>
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 64,
          height: 64,
          borderRadius: 9999,
          background: "rgba(18, 25, 54, 0.05)",
        }}
      >
        {icon}
      </div>
    </div>
  );
}
