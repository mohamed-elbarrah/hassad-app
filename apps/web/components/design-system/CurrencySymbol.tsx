"use client";

import { useState, useSyncExternalStore } from "react";
import { useCurrency, type CurrencyConfig } from "@/hooks/useCurrency";

export type { CurrencyConfig };

/** @deprecated Use CurrencyConfig from useCurrency. */
export type CurrencySymbolConfig = CurrencyConfig;

const MIN_DIMENSION = 8;
const MAX_DIMENSION = 96;
const MAX_INLINE_SVG_BYTES = 1024 * 1024;
const MAX_INLINE_SVG_ELEMENTS = 2000;
const MAX_INLINE_SVG_DEPTH = 32;
const MAX_INLINE_SVG_USES = 128;
const ALLOWED_STYLE_PROPERTIES = new Set([
  "fill",
  "fill-rule",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "opacity",
  "color",
  "display",
  "visibility",
  "clip-rule",
  "enable-background",
]);
// Only presentation-only literals are accepted. Reject every CSS function
// (including escaped spellings), because CSS functions can load resources or
// resolve attacker-controlled values in a browser context.
const UNSAFE_STYLE_VALUE = /(?:[a-z-]+\s*\(|\\|[<>"'{}]|\/\*|!important)/i;
const SAFE_COLOR_VALUE = /^(?:currentcolor|inherit|#[0-9a-f]{3,8}|[a-z]+)$/i;
const SAFE_NUMBER_VALUE =
  /^(?:0|(?:0|[1-9]\d*)(?:\.\d+)?)(?:px|pt|em|rem|%)?$/i;
const SAFE_STYLE_VALUES: Record<string, RegExp> = {
  fill: /^(?:none|currentcolor|inherit|#[0-9a-f]{3,8}|[a-z]+)$/i,
  stroke: /^(?:none|currentcolor|inherit|#[0-9a-f]{3,8}|[a-z]+)$/i,
  color: SAFE_COLOR_VALUE,
  "fill-rule": /^(?:nonzero|evenodd|inherit)$/i,
  "clip-rule": /^(?:nonzero|evenodd|inherit)$/i,
  "stroke-linecap": /^(?:butt|round|square|inherit)$/i,
  "stroke-linejoin": /^(?:miter|round|bevel|inherit)$/i,
  "stroke-width": SAFE_NUMBER_VALUE,
  "stroke-miterlimit": SAFE_NUMBER_VALUE,
  "fill-opacity": /^(?:0|1|0?\.\d+|100%|\d{1,2}%)$/i,
  "stroke-opacity": /^(?:0|1|0?\.\d+|100%|\d{1,2}%)$/i,
  opacity: /^(?:0|1|0?\.\d+|100%|\d{1,2}%)$/i,
  display: /^(?:inline|block|none|inherit)$/i,
  visibility: /^(?:visible|hidden|collapse|inherit)$/i,
  "enable-background": /^new(?:\s+(?:0|(?:0|[1-9]\d*)(?:\.\d+)?)){0,4}$/i,
};
const subscribeToHydration = () => () => {};

function hasUnsafeStyleCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
}

function sanitizeStyleDeclaration(value: string): string | null {
  const declarations = value.split(";");
  const normalized: string[] = [];
  for (const declaration of declarations) {
    if (!declaration.trim()) continue;
    const separator = declaration.indexOf(":");
    if (separator <= 0) return null;
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const styleValue = declaration.slice(separator + 1).trim();
    if (
      !ALLOWED_STYLE_PROPERTIES.has(property) ||
      !styleValue ||
      UNSAFE_STYLE_VALUE.test(styleValue) ||
      hasUnsafeStyleCharacters(styleValue) ||
      !SAFE_STYLE_VALUES[property]?.test(styleValue)
    )
      return null;
    normalized.push(`${property}: ${styleValue}`);
  }
  return normalized.length ? normalized.join("; ") : null;
}

function isSafePresentationValue(name: string, value: string): boolean {
  return Boolean(
    SAFE_STYLE_VALUES[name] &&
    !UNSAFE_STYLE_VALUE.test(value) &&
    !hasUnsafeStyleCharacters(value) &&
    SAFE_STYLE_VALUES[name].test(value.trim()),
  );
}

function boundedDimension(value: number | null | undefined, fallback: number) {
  return Number.isFinite(value)
    ? Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, value!))
    : fallback;
}

function safeSvgUrl(value: string | null | undefined, allowBlob = false) {
  if (!value) return null;
  try {
    // Do not resolve arbitrary storage keys into URLs. Only absolute HTTP(S),
    // same-origin paths, and browser-local upload previews are accepted.
    const url = new URL(value, "https://currency.invalid");
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    // Never fetch a source carrying credentials from the browser.
    if (url.username || url.password) return null;
    if (
      (!isHttp && !(allowBlob && url.protocol === "blob:")) ||
      (!/^https?:\/\//i.test(value) &&
        !value.startsWith("/") &&
        !value.startsWith("blob:"))
    )
      return null;
    return /^https?:\/\//i.test(value) || value.startsWith("blob:")
      ? value
      : url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

/**
 * Sanitizes the small, presentation-only SVG subset accepted by this renderer.
 * The API sanitizes persisted SVGs too, but the client deliberately does not
 * assume that every value received from storage is safe.
 */
export function sanitizeInlineSvg(
  value: string | null | undefined,
  dimensions?: { width: number; height: number },
) {
  if (!value || typeof DOMParser === "undefined") return null;
  // Match the backend payload limit before handing attacker-controlled markup
  // to the XML parser (UTF-16 length is a conservative upper bound here).
  if (value.length > MAX_INLINE_SVG_BYTES) return null;
  const document = new DOMParser().parseFromString(value, "image/svg+xml");
  if (document.querySelector("parsererror")) return null;
  const root = document.documentElement;
  if (!root || root.localName.toLowerCase() !== "svg") return null;

  const allowedElements = new Set([
    "svg",
    "g",
    "path",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "rect",
    // Symbols are used by uploaded icon sets to share path definitions.
    "defs",
    "symbol",
    "use",
    "title",
    "desc",
  ]);
  // Keep the geometry required by common icon exports. Attributes are still
  // allowlisted (not copied wholesale), and the generated dimensions below
  // prevent an SVG's own size from escaping the renderer's bounds.
  // Attribute names are case-insensitive in the SVG/XML input we accept, so
  // compare normalized names. In particular, `viewBox` would otherwise be
  // dropped because DOMParser exposes it with a capital B.
  const allowedAttributes = new Map([
    ["aria-hidden", "aria-hidden"],
    ["aria-label", "aria-label"],
    ["aria-labelledby", "aria-labelledby"],
    ["class", "class"],
    ["cx", "cx"],
    ["cy", "cy"],
    ["d", "d"],
    ["desc", "desc"],
    ["fill", "fill"],
    ["fill-opacity", "fill-opacity"],
    ["fill-rule", "fill-rule"],
    ["height", "height"],
    ["href", "href"],
    ["id", "id"],
    ["opacity", "opacity"],
    ["points", "points"],
    ["preserveaspectratio", "preserveAspectRatio"],
    ["r", "r"],
    ["role", "role"],
    ["rx", "rx"],
    ["ry", "ry"],
    ["stroke", "stroke"],
    ["stroke-linecap", "stroke-linecap"],
    ["stroke-linejoin", "stroke-linejoin"],
    ["stroke-miterlimit", "stroke-miterlimit"],
    ["stroke-opacity", "stroke-opacity"],
    ["stroke-width", "stroke-width"],
    ["color", "color"],
    ["display", "display"],
    ["visibility", "visibility"],
    ["clip-rule", "clip-rule"],
    ["enable-background", "enable-background"],
    ["style", "style"],
    ["transform", "transform"],
    ["viewbox", "viewBox"],
    ["width", "width"],
    ["xmlns", "xmlns"],
    ["x", "x"],
    ["x1", "x1"],
    ["x2", "x2"],
    ["xlink:href", "xlink:href"],
    ["xmlns:xlink", "xmlns:xlink"],
    ["y", "y"],
    ["y1", "y1"],
    ["y2", "y2"],
  ]);

  const elements = [root, ...Array.from(root.querySelectorAll("*"))];
  if (elements.length > MAX_INLINE_SVG_ELEMENTS) return null;

  const ids = new Map<string, Element>();
  for (const element of elements) {
    const id = element.getAttribute("id");
    if (id) ids.set(id, element);
  }

  let useCount = 0;
  for (const element of elements) {
    let depth = 0;
    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    )
      depth += 1;
    if (depth >= MAX_INLINE_SVG_DEPTH) return null;

    if (element.localName.toLowerCase() === "use") {
      useCount += 1;
      if (useCount > MAX_INLINE_SVG_USES) return null;
      const reference =
        element.getAttribute("href") ?? element.getAttribute("xlink:href");
      if (reference) {
        const chain = new Set<Element>();
        let target = ids.get(reference.slice(1));
        while (target) {
          if (chain.has(target)) return null;
          chain.add(target);
          const nestedReference =
            target.getAttribute("href") ?? target.getAttribute("xlink:href");
          target = nestedReference?.startsWith("#")
            ? ids.get(nestedReference.slice(1))
            : undefined;
        }
      }
    }
  }

  for (const element of elements) {
    if (!allowedElements.has(element.localName.toLowerCase())) {
      element.remove();
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const canonicalName = allowedAttributes.get(name);
      const attributeValue = attribute.value.trim();
      const hasUnsafeUrl =
        /url\(/i.test(attributeValue) &&
        !/^url\(\s*#[a-z0-9_.:-]+\s*\)$/i.test(attributeValue);
      const isPresentationAttribute = SAFE_STYLE_VALUES[name] !== undefined;
      // <use> is useful for defs-based icons, but href must never escape this
      // document. This also covers the legacy xlink:href spelling.
      const isLocalReference =
        (name === "href" || name === "xlink:href") &&
        /^#[a-z0-9_.:-]+$/i.test(attributeValue);
      const isReferenceAttribute = name === "href" || name === "xlink:href";
      const hasUnsafeNamespace =
        (name === "xmlns" && attributeValue !== "http://www.w3.org/2000/svg") ||
        (name === "xmlns:xlink" &&
          attributeValue !== "http://www.w3.org/1999/xlink");
      if (
        !canonicalName ||
        name.startsWith("on") ||
        /(?:javascript|data|vbscript):/i.test(attributeValue) ||
        hasUnsafeUrl ||
        (isReferenceAttribute && !isLocalReference) ||
        (isPresentationAttribute &&
          !isSafePresentationValue(name, attributeValue)) ||
        hasUnsafeNamespace
      ) {
        element.removeAttribute(attribute.name);
      } else if (name === "style") {
        const safeStyle = sanitizeStyleDeclaration(attribute.value);
        // Remove the source spelling first (for example, `STYLE`) so the
        // serialized XML cannot contain duplicate style attributes.
        element.removeAttribute(attribute.name);
        if (safeStyle) element.setAttribute("style", safeStyle);
      } else if (name === "width" || name === "height") {
        // Keep dimensions bounded even on nested <svg>/<use> elements. Root
        // dimensions are replaced below, while non-numeric units are removed
        // rather than allowing an unbounded percentage or CSS expression.
        const numericDimension = /^\d+(?:\.\d+)?(?:px)?$/i.test(attributeValue)
          ? Number.parseFloat(attributeValue)
          : NaN;
        if (!Number.isFinite(numericDimension)) {
          element.removeAttribute(attribute.name);
        } else {
          element.setAttribute(
            canonicalName,
            String(boundedDimension(numericDimension, 24)),
          );
          if (attribute.name !== canonicalName)
            element.removeAttribute(attribute.name);
        }
      } else if (attribute.name !== canonicalName) {
        element.removeAttribute(attribute.name);
        element.setAttribute(canonicalName, attributeValue);
      }
    }
  }

  if (dimensions) {
    // Set dimensions on the actual SVG, rather than only constraining its
    // wrapper. This also replaces attacker-controlled width/height values.
    root.setAttribute("width", String(boundedDimension(dimensions.width, 24)));
    root.setAttribute(
      "height",
      String(boundedDimension(dimensions.height, 20)),
    );
  }

  return root.outerHTML;
}

interface CurrencySymbolProps {
  /** Uses the configured default currency when omitted. */
  currency?: CurrencyConfig;
  className?: string;
  width?: number;
  height?: number;
}

export function CurrencySymbol({
  currency: suppliedCurrency,
  className,
  width,
  height,
}: CurrencySymbolProps) {
  const { currency: defaultCurrency } = useCurrency();
  return (
    <SymbolRenderer
      currency={suppliedCurrency ?? defaultCurrency}
      className={className}
      width={width}
      height={height}
    />
  );
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
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const width = boundedDimension(widthOverride ?? svgWidth, 24);
  const height = boundedDimension(heightOverride ?? svgHeight, 20);

  if (symbolType === "SVG_URL") {
    const source = safeSvgUrl(svgKey ?? svgUrl);
    return source ? (
      <RemoteSymbol
        key={source}
        src={source}
        alt={symbol}
        width={width}
        height={height}
        className={className}
        fallback={symbol}
      />
    ) : (
      <span className={className}>{symbol}</span>
    );
  }

  if (symbolType === "SVG_UPLOAD") {
    const source = safeSvgUrl(svgUrl, true);
    return source ? (
      <RemoteSymbol
        key={source}
        src={source}
        alt={symbol}
        width={width}
        height={height}
        className={className}
        fallback={symbol}
      />
    ) : (
      <span className={className}>{symbol}</span>
    );
  }

  if (symbolType === "SVG_INLINE" && isHydrated) {
    const sanitized = sanitizeInlineSvg(svgKey, { width, height });
    if (sanitized) {
      return (
        <span
          className={className}
          role="img"
          aria-label={symbol}
          dangerouslySetInnerHTML={{ __html: sanitized }}
          style={{
            display: "inline-flex",
            width,
            height,
            verticalAlign: "middle",
            overflow: "hidden",
          }}
        />
      );
    }
  }

  return <span className={className}>{symbol}</span>;
}

function RemoteSymbol({
  src,
  alt,
  width,
  height,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <span className={className}>{fallback || "—"}</span>;
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      referrerPolicy="no-referrer"
      style={{ display: "inline-block", objectFit: "contain" }}
      onError={() => setFailed(true)}
    />
  );
}
