"use client";

import { useCurrency, type CurrencyConfig } from "@/hooks/useCurrency";

interface CurrencySymbolProps {
  className?: string;
  width?: number;
  height?: number;
}

export function CurrencySymbol({ className, width, height }: CurrencySymbolProps) {
  const { currency } = useCurrency();
  return <SymbolRenderer currency={currency} className={className} width={width} height={height} />;
}

export function SymbolRenderer({
  currency,
  className,
  width: widthOverride,
  height: heightOverride,
}: {
  currency: CurrencyConfig;
  className?: string;
  width?: number;
  height?: number;
}) {
  const { symbolType, svgKey, svgWidth, svgHeight, symbol } = currency;
  const w = widthOverride ?? svgWidth ?? 24;
  const h = heightOverride ?? svgHeight ?? 20;

  if (symbolType === "SVG_URL" && svgKey) {
    return (
      <img
        src={svgKey}
        alt={symbol}
        width={w}
        height={h}
        className={className}
        style={{ display: "inline-block", objectFit: "contain" }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  if (symbolType === "SVG_INLINE" && svgKey) {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: svgKey }}
        style={{
          display: "inline-flex",
          width: w,
          height: h,
          verticalAlign: "middle",
          overflow: "hidden",
        }}
      />
    );
  }

  return <span className={className}>{symbol}</span>;
}
