import { BadRequestException } from "@nestjs/common";

/** Maximum decoded SVG payload accepted by the currency workstream. */
export const MAX_SVG_BYTES = 1024 * 1024;

const ALLOWED_ELEMENTS = new Set([
  "svg", "g", "path", "circle", "ellipse", "line", "polyline", "polygon", "rect",
  "title", "desc", "defs", "symbol", "use",
]);
const ALLOWED_ATTRIBUTES = new Set([
  "xmlns", "xmlns:xlink", "viewbox", "width", "height", "fill", "fill-rule", "fill-opacity",
  "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit",
  "stroke-opacity", "opacity", "color", "display", "visibility", "clip-rule", "enable-background", "d", "cx", "cy", "r", "rx", "ry", "x", "y",
  "x1", "x2", "y1", "y2", "points", "transform", "preserveaspectratio", "id",
  "class", "role", "aria-hidden", "aria-label", "aria-labelledby", "href", "xlink:href", "style",
]);
const CANONICAL_ATTRIBUTES: Record<string, string> = {
  viewbox: "viewBox",
  preserveaspectratio: "preserveAspectRatio",
};

// Inline SVG is allowed to use presentation styles, but not arbitrary CSS.
// Keeping this list deliberately small avoids CSS features that can load
// resources or alter the surrounding document. Values are checked separately
// so a harmless style such as `fill: #123456` survives a read/edit cycle.
const ALLOWED_STYLE_PROPERTIES = new Set([
  "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-linecap",
  "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "opacity", "color",
  "display", "visibility", "clip-rule", "enable-background",
]);
// Styles are presentation-only literals. In particular, do not pass CSS
// functions through to a browser: even seemingly benign functions can be
// extended by CSS (and escaped function names can evade substring filters).
const UNSAFE_STYLE_VALUE = /(?:[a-z-]+\s*\(|\\|[<>"'{}]|\/\*|!important)/i;
const SAFE_COLOR_VALUE = /^(?:none|currentcolor|inherit|#[0-9a-f]{3,8}|[a-z]+)$/i;
const SAFE_NUMBER_VALUE = /^(?:0|(?:0|[1-9]\d*)(?:\.\d+)?)(?:px|pt|em|rem|%)?$/i;
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

function isSafePresentationValue(name: string, value: string): boolean {
  return Boolean(SAFE_STYLE_VALUES[name]
    && !UNSAFE_STYLE_VALUE.test(value)
    && !hasUnsafeStyleCharacters(value)
    && SAFE_STYLE_VALUES[name].test(value.trim()));
}

function escapeXmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function hasUnsafeStyleCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
}

function sanitizeStyleDeclaration(value: string): string {
  const declarations = value.split(";");
  const normalized: string[] = [];
  for (const declaration of declarations) {
    if (!declaration.trim()) continue;
    const separator = declaration.indexOf(":");
    if (separator <= 0) reject({ reason: "UNSAFE_STYLE" });
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const styleValue = declaration.slice(separator + 1).trim();
    if (!ALLOWED_STYLE_PROPERTIES.has(property)
      || !styleValue
      || UNSAFE_STYLE_VALUE.test(styleValue)
      || hasUnsafeStyleCharacters(styleValue)
      || !SAFE_STYLE_VALUES[property]?.test(styleValue)) {
      reject({ reason: "UNSAFE_STYLE", property });
    }
    normalized.push(`${property}: ${styleValue}`);
  }
  if (!normalized.length) reject({ reason: "UNSAFE_STYLE" });
  return normalized.join("; ");
}

const LOCAL_FRAGMENT_REFERENCE = /^#[a-z0-9_.:-]+$/i;
const SAFE_SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const SAFE_XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

function reject(details: Record<string, unknown>): never {
  throw new BadRequestException({ code: "SVG_UNSAFE_MARKUP", details });
}

/**
 * Validates and sanitizes SVG as a deliberately small, static SVG subset.
 * Unknown elements/attributes are rejected (rather than stripped), preventing
 * an attacker from relying on browser parser differences or future features.
 */
export function sanitizeSvgContent(svg: string): string {
  if (typeof svg !== "string" || !svg.trim()) reject({ reason: "EMPTY" });
  const input = svg.trim();
  const bytes = Buffer.byteLength(input, "utf8");
  if (bytes > MAX_SVG_BYTES) reject({ reason: "TOO_LARGE", maxBytes: MAX_SVG_BYTES });
  if (/<!DOCTYPE|<!ENTITY|<\?|<!--[\s\S]*?-->|<!\[CDATA\[/i.test(input)) {
    reject({ reason: "UNSUPPORTED_XML" });
  }
  if (/<\s*(script|style|foreignObject|iframe|object|embed|image|link|animate|set|audio|video|form)\b/i.test(input)) {
    reject({ reason: "UNSAFE_ELEMENT" });
  }

  const tags: string[] = [];
  const xlinkNamespaceStack: boolean[] = [];
  let elementCount = 0;
  let useCount = 0;
  const output = input.replace(/<\s*(\/?)\s*([A-Za-z][\w:.-]*)([^>]*)>/g, (whole, closing, rawName, rawAttrs) => {
    if (rawName.includes(":")) reject({ reason: "UNSAFE_NAMESPACE", element: rawName });
    const name = rawName.toLowerCase();
    if (!ALLOWED_ELEMENTS.has(name)) reject({ reason: "ELEMENT_NOT_ALLOWED", element: rawName });
    if (closing) {
      if (rawAttrs.trim()) reject({ reason: "INVALID_CLOSING_TAG", element: rawName });
      const expected = tags.pop();
      xlinkNamespaceStack.pop();
      if (expected !== name) reject({ reason: "MALFORMED_XML" });
      return `</${name}>`;
    }
    elementCount += 1;
    if (elementCount > 2000) reject({ reason: "TOO_MANY_ELEMENTS", maxElements: 2000 });
    if (name === "use") {
      useCount += 1;
      if (useCount > 128) reject({ reason: "TOO_MANY_USE_ELEMENTS", maxUses: 128 });
    }

    const attrs: string[] = [];
    const attrPattern = /([A-Za-z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*')/g;
    let cursor = 0;
    let match: RegExpExecArray | null;
    let hasXlinkReference = false;
    let declaresSafeXlinkNamespace = xlinkNamespaceStack.at(-1) ?? false;
    const seenAttributes = new Set<string>();
    while ((match = attrPattern.exec(rawAttrs))) {
      if (rawAttrs.slice(cursor, match.index).trim()) reject({ reason: "INVALID_ATTRIBUTE" });
      cursor = attrPattern.lastIndex;
      const attr = match[1];
      const attrName = attr.toLowerCase();
      if (seenAttributes.has(attrName)) reject({ reason: "DUPLICATE_ATTRIBUTE", attribute: attr });
      seenAttributes.add(attrName);
      const value = match[2].slice(1, -1);
      const normalizedValue = value.trim();
      const isReferenceAttribute = attrName === "href" || attrName === "xlink:href";
      if (attrName === "style") {
        attrs.push(`style="${escapeXmlAttribute(sanitizeStyleDeclaration(value))}"`);
        continue;
      }
      if (attrName === "xlink:href") hasXlinkReference = true;
      if (attrName === "xmlns:xlink" && normalizedValue === SAFE_XLINK_NAMESPACE) declaresSafeXlinkNamespace = true;
      const hasUnsafeNamespace = (attrName === "xmlns" && normalizedValue !== SAFE_SVG_NAMESPACE)
        || (attrName === "xmlns:xlink" && normalizedValue !== SAFE_XLINK_NAMESPACE);
      if (attrName.startsWith("on") || !ALLOWED_ATTRIBUTES.has(attrName)) reject({ reason: "ATTRIBUTE_NOT_ALLOWED", attribute: attr });
      const isPresentationAttribute = ALLOWED_STYLE_PROPERTIES.has(attrName);
      if (/javascript:|data:|vbscript:|url\s*\(/i.test(value)
        || (isReferenceAttribute && !LOCAL_FRAGMENT_REFERENCE.test(normalizedValue))
        || (isPresentationAttribute && !isSafePresentationValue(attrName, value))
        || hasUnsafeNamespace) {
        reject({ reason: isReferenceAttribute ? "UNSAFE_REFERENCE" : "UNSAFE_ATTRIBUTE", attribute: attr });
      }
      const canonicalAttribute = CANONICAL_ATTRIBUTES[attrName] ?? attrName;
      attrs.push(`${canonicalAttribute}="${escapeXmlAttribute(value)}"`);
    }
    if (rawAttrs.slice(cursor).replace(/\/$/, "").trim()) reject({ reason: "INVALID_ATTRIBUTE" });
    if (hasXlinkReference && !declaresSafeXlinkNamespace) reject({ reason: "UNSAFE_NAMESPACE", attribute: "xlink:href" });
    const selfClosing = /\/\s*$/.test(rawAttrs);
    if (!selfClosing) {
      if (tags.length >= 32) reject({ reason: "SVG_TOO_DEEP", maxDepth: 32 });
      tags.push(name);
      xlinkNamespaceStack.push(declaresSafeXlinkNamespace);
    }
    return `<${name}${attrs.length ? ` ${attrs.join(" ")}` : ""}${selfClosing ? " /" : ""}>`;
  });

  const roots = output.match(/<svg(?:\s|>)/gi) ?? [];
  const closes = output.match(/<\/svg>/gi) ?? [];
  if (roots.length !== 1 || closes.length !== 1 || !/^<svg(?:\s|>)/i.test(output) || tags.length || !/<\/svg>\s*$/i.test(output)) reject({ reason: "INVALID_DOCUMENT" });
  return output;
}

/** Backwards-compatible name used by the currency service and DTO transform. */
export const cleanSvgContent = sanitizeSvgContent;
