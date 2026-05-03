"use client";

import { ReactNode } from "react";

interface KpiRowProps {
  label: string;
  value: string;
  icon: ReactNode;
}

/* ── KPI Row ────────────────────────────────────────────────────────────
   Exact from source:
   - Card: width 416px, border 1.5px solid #E1E4EA, radius 16px, bg #FFFFFF
   - Icon circle: 64x64, bg rgba(18,25,54,0.05)
   - Label: 18px weight 400 rgba(0,0,0,0.6)
   - Value: 24px weight 500 #000000
─────────────────────────────────────────────────────────────────────────── */
export function KpiRow({ label, value, icon }: KpiRowProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 bg-white"
      style={{
        border: "1.5px solid #E1E4EA",
        borderRadius: 16,
      }}
    >
      <div className="text-right">
        <p
          style={{
            fontSize: 18,
            fontWeight: 400,
            lineHeight: "27px",
            color: "rgba(0, 0, 0, 0.6)",
          }}
        >
          {label}
        </p>
        <p
          className="mt-0.5"
          style={{
            fontSize: 24,
            fontWeight: 500,
            lineHeight: "36px",
            color: "#000000",
          }}
        >
          {value}
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
