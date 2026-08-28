"use client";

import { useState, useSyncExternalStore } from "react";
import { useCurrency, type CurrencyConfig } from "@/hooks/useCurrency";

const MIN_DIMENSION = 8;
const MAX_DIMENSION = 96;
const subscribeToHydration = () => () => {};

function boundedDimension(value: number | null | undefined, fallback: number) {
  return Number.isFinite(value) ? Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, value!)) : fallback;
}

function safeSvgUrl(value: string | null | undefined, allowBlob = false) {
  if (!value) return null;
  try {
    // Do not resolve arbitrary storage keys into URLs. Only absolute HTTP(S),
    // same-origin paths, and browser-local upload previews are accepted.
    const url = new URL(value, "https://currency.invalid");
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    if ((!isHttp && !(allowBlob && url.protocol === "blob:")) || (!/^https?:\/\//i.test(value) && !value.startsWith("/" ) && !value.startsWith("blob:"))) return null;
    return /^https?:\/\//i.test(value) || value.startsWith("blob:") ? value : url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

/**
 * Sanitizes the small, presentation-only SVG subset accepted by this renderer.
 * The API sanitizes persisted SVGs too, but the client deliberately does not
 * assume that every value received from storage is safe.
 */
export function sanitizeInlineSvg(value: string | null | undefined) {
  if (!value || typeof DOMParser === "undefined") return null;
  const document = new DOMParser().parseFromString(value, "image/svg+xml");
  if (document.querySelector("parsererror")) return null;
  const root = document.documentElement;
  if (!root || root.localName.toLowerCase() !== "svg") return null;

  const allowedElements = new Set(["svg", "g", "path", "circle", "ellipse", "line", "polyline", "polygon", "rect"]);
  const allowedAttributes = new Set([
    "aria-hidden", "fill", "fill-rule", "height", "id", "opacity", "preserveAspectRatio",
    "stroke", "stroke-linecap", "stroke-linejoin", "stroke-width", "transform", "viewBox", "width", "xmlns", "x", "x1", "x2", "y", "y1", "y2",
  ]);

  for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
    if (!allowedElements.has(element.localName.toLowerCase())) {
      element.remove();
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const attributeValue = attribute.value.trim();
      if (!allowedAttributes.has(name) || name.startsWith("on") || /(?:javascript|data|vbscript):/i.test(attributeValue)) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  return root.outerHTML;
}

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
  const { symbolType, svgKey, svgUrl, svgWidth, svgHeight, symbol } = currency;
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const width = boundedDimension(widthOverride ?? svgWidth, 24);
  const height = boundedDimension(heightOverride ?? svgHeight, 20);

  if (symbolType === "SVG_URL" || symbolType === "SVG_UPLOAD") {
    const source = symbolType === "SVG_URL" ? safeSvgUrl(svgKey) : safeSvgUrl(svgUrl, true);
    return source ? (
      <RemoteSymbol key={source} src={source} alt={symbol} width={width} height={height} className={className} fallback={symbol} />
    ) : <span className={className}>{symbol}</span>;
  }

  if (symbolType === "SVG_INLINE" && isHydrated) {
    const sanitized = sanitizeInlineSvg(svgKey);
    if (sanitized) {
      return (
        <span
          className={className}
          role="img"
          aria-label={symbol}
          dangerouslySetInnerHTML={{ __html: sanitized }}
          style={{ display: "inline-flex", width, height, verticalAlign: "middle", overflow: "hidden" }}
        />
      );
    }
  }

  return <span className={className}>{symbol}</span>;
}

function RemoteSymbol({
  src, alt, width, height, className, fallback,
}: { src: string; alt: string; width: number; height: number; className?: string; fallback: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <span className={className}>{fallback || "ر.س"}</span>;
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ display: "inline-block", objectFit: "contain" }}
      onError={() => setFailed(true)}
    />
  );
}
