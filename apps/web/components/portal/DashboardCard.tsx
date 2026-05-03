"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  icon?: LucideIcon;
  showAll?: boolean;
  onShowAll?: () => void;
  children: ReactNode;
  className?: string;
}

/* ── Dashboard Card Wrapper ─────────────────────────────────────────────
   Exact from source:
   - width: 466px, border: 1.5px solid #E1E4EA, radius: 30px, bg: #FFFFFF
   - header divider: border: 1.5px solid #ECEEF2
   - "عرض الكل" button: border: 1.5px solid #E1E4EA, radius: 10px
   - title: 24px weight 500, icon color: #525866
─────────────────────────────────────────────────────────────────────────── */
export function DashboardCard({
  title,
  icon: Icon,
  showAll = true,
  onShowAll,
  children,
  className = "",
}: DashboardCardProps) {
  return (
    <div
      className={`bg-white overflow-hidden ${className}`}
      style={{
        border: "1.5px solid #E1E4EA",
        borderRadius: 30,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1.5px solid #ECEEF2" }}
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              style={{
                width: 29,
                height: 29,
                color: "#525866",
              }}
            />
          )}
          <h3
            style={{
              fontSize: 24,
              fontWeight: 500,
              lineHeight: "36px",
              color: "#000000",
            }}
          >
            {title}
          </h3>
        </div>
        {showAll && (
          <button
            onClick={onShowAll}
            className="bg-white"
            style={{
              fontSize: 18,
              fontWeight: 500,
              lineHeight: "27px",
              color: "#525866",
              border: "1.5px solid #E1E4EA",
              borderRadius: 10,
              padding: "8px 20px",
            }}
          >
            عرض الكل
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">{children}</div>
    </div>
  );
}
