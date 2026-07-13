"use client";

import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  color = "currentColor",
  width = 64,
  height = 28,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const viewW = width;
  const viewH = height;
  const stepX = viewW / (data.length - 1);

  const points = data
    .map((v, i) => `${i * stepX},${viewH - ((v - min) / range) * (viewH - 2) - 1}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      className={cn("shrink-0", className)}
      style={{ width, height }}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
