"use client";

import { ReactNode } from "react";

interface ActionItemCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  primaryAction: string;
  secondaryAction: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryColor?: "purple" | "blue";
}

/* ── Action Item Card ───────────────────────────────────────────────────
   Exact from source:
   - Card: width 416px, border 1.5px solid #E1E4EA, radius 16px, bg #FFFFFF
   - Icon circle: 64x64, bg rgba(18,25,54,0.05)
   - Title: 22px weight 500, Subtitle: 18px weight 400 rgba(0,0,0,0.6)
   - Primary button: radius 16px, height 56px
     Purple: #7A13E8, Blue: #2684FC
   - Secondary button: border 1.5px solid #E1E4EA, radius 16px, height 56px
     text: #6C6F75
─────────────────────────────────────────────────────────────────────────── */
export function ActionItemCard({
  title,
  subtitle,
  icon,
  primaryAction,
  secondaryAction,
  onPrimary,
  onSecondary,
  primaryColor = "purple",
}: ActionItemCardProps) {
  const primaryBg = primaryColor === "purple" ? "#7A13E8" : "#2684FC";

  return (
    <div
      className="p-5 bg-white space-y-4"
      style={{
        border: "1.5px solid #E1E4EA",
        borderRadius: 16,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 text-right">
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
            {subtitle}
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

      <div className="flex items-center gap-3">
        <button
          onClick={onSecondary}
          className="flex-1 bg-white"
          style={{
            height: 56,
            border: "1.5px solid #E1E4EA",
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 600,
            lineHeight: "164.9%",
            color: "#6C6F75",
          }}
        >
          {secondaryAction}
        </button>
        <button
          onClick={onPrimary}
          className="flex-1"
          style={{
            height: 56,
            background: primaryBg,
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 600,
            lineHeight: "164.9%",
            color: "#FFFFFF",
          }}
        >
          {primaryAction}
        </button>
      </div>
    </div>
  );
}
