"use client";

import { cn } from "@/lib/utils";

interface ClientBriefGaugeProps {
  value?: number | null;
  max?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  sublabel?: string;
  className?: string;
}

export function ClientBriefGauge({
  value,
  max = 100,
  size = "md",
  label = "معدل الرضا",
  sublabel = "بناءً على تقييمات المشاريع",
  className,
}: ClientBriefGaugeProps) {
  const percentage = Math.min(Math.max(Math.round(value ?? 0), 0), max);
  const radius = 70;
  const strokeWidth = 14;
  const center = 80;
  const totalLength = Math.PI * radius;
  const fillLength = (percentage / max) * totalLength;

  const sizeClasses = {
    sm: "max-w-[160px]",
    md: "max-w-[240px]",
    lg: "max-w-[280px]",
  };

  const getColor = (val: number) => {
    if (val >= 80) return "#0ED589";
    if (val >= 60) return "#E7BE52";
    if (val >= 40) return "#F8AF01";
    return "#EF4444";
  };

  const color = getColor(percentage);

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        sizeClasses[size],
        className,
      )}
    >
      <div className="relative w-full">
        <svg
          viewBox="0 0 160 100"
          className="w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Track */}
          <path
            d={`M ${center + radius} ${center} A ${radius} ${radius} 0 0 0 ${center - radius} ${center}`}
            fill="none"
            stroke="#F2F4F7"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={`M ${center + radius} ${center} A ${radius} ${radius} 0 0 0 ${center - radius} ${center}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${fillLength} ${totalLength}`}
            style={{ transition: "stroke-dasharray 1s ease-out" }}
          />
          <text
            x={center}
            y={center + 12}
            textAnchor="middle"
            style={{
              fontSize: 36,
              fontWeight: 800,
              fill: "#000000",
              fontFamily:
                "var(--font-ibm-plex-sans-arabic), 'IBM Plex Sans Arabic', sans-serif",
            }}
          >
            {percentage}%
          </text>
        </svg>
      </div>
      <div className="mt-2">
        <p className="text-sm font-semibold text-natural-100">{label}</p>
        <p className="text-xs text-portal-note-text mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}
