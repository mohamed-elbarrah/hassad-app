"use client";

interface GaugeChartProps {
  value?: number;
  max?: number;
}

/* ── SVG Semi-circular Gauge ───────────────────────────────────────────
   Exact path values provided by user:
   - Arc: M 141 93 A 66 66 0 0 0 9 93
   - Radius: 66
   - stroke-width: 18
   - Track: #f5f7fa
   - Fill: #121936
   - Value text: x=75, y=70, 32px, weight 800
   - Label text: x=75, y=85, 16px, weight 200
─────────────────────────────────────────────────────────────────────────── */
export function GaugeChart({ value = 70, max = 100 }: GaugeChartProps) {
  const radius = 66;
  const strokeWidth = 18;
  const centerX = 75;
  const centerY = 93;

  // Exact arc path
  const arcPath = `M 141 93 A 66 66 0 0 0 9 93`;

  // Arc length: π * r
  const totalLength = Math.PI * radius; // ~207.34511513692635
  const fillLength = (value / max) * totalLength; // e.g. 145.14158059584844 for 70%

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox="0 0 150 100"
        className="w-full"
        style={{ maxWidth: 220, height: "auto" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Track (light gray background arc #F5F7FA) */}
        <path
          d={arcPath}
          fill="none"
          stroke="#f5f7fa"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Fill (navy arc #121936) */}
        <path
          d={arcPath}
          fill="none"
          stroke="#121936"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${fillLength} ${totalLength}`}
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />

        {/* Value text — 32px weight 800 */}
        <text
          x={centerX}
          y="70"
          textAnchor="middle"
          style={{
            fontSize: 32,
            fontWeight: 800,
            fontFamily:
              "var(--font-ibm-plex-sans-arabic), 'IBM Plex Sans Arabic', sans-serif",
            fill: "rgb(0, 0, 0)",
          }}
        >
          {value}
        </text>

        {/* "من 100" label — 16px weight 200 */}
        <text
          x={centerX}
          y="85"
          textAnchor="middle"
          style={{
            fontSize: 16,
            fontWeight: 200,
            fontFamily:
              "var(--font-ibm-plex-sans-arabic), 'IBM Plex Sans Arabic', sans-serif",
            fill: "rgba(0, 0, 0, 0.6)",
          }}
        >
          من {max}
        </text>
      </svg>
    </div>
  );
}
