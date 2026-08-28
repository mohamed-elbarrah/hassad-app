import { BadRequestException } from "@nestjs/common";

/** Maximum decoded SVG payload accepted by the currency workstream. */
export const MAX_SVG_BYTES = 1024 * 1024;

const ALLOWED_ELEMENTS = new Set([
  "svg", "g", "path", "circle", "ellipse", "line", "polyline", "polygon", "rect",
  "title", "desc", "defs", "symbol", "use",
]);
const ALLOWED_ATTRIBUTES = new Set([
  "xmlns", "viewBox", "width", "height", "fill", "fill-rule", "fill-opacity",
  "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit",
  "stroke-opacity", "opacity", "d", "cx", "cy", "r", "rx", "ry", "x", "y",
  "x1", "x2", "y1", "y2", "points", "transform", "preserveAspectRatio", "id",
  "class", "role", "aria-label", "aria-labelledby",
]);

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
  const output = input.replace(/<\s*(\/?)\s*([A-Za-z][\w:.-]*)([^>]*)>/g, (whole, closing, rawName, rawAttrs) => {
    const name = rawName.toLowerCase().split(":").pop()!;
    if (!ALLOWED_ELEMENTS.has(name)) reject({ reason: "ELEMENT_NOT_ALLOWED", element: rawName });
    if (closing) {
      if (rawAttrs.trim()) reject({ reason: "INVALID_CLOSING_TAG", element: rawName });
      const expected = tags.pop();
      if (expected !== name) reject({ reason: "MALFORMED_XML" });
      return `</${name}>`;
    }

    const attrs: string[] = [];
    const attrPattern = /([A-Za-z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*')/g;
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = attrPattern.exec(rawAttrs))) {
      if (rawAttrs.slice(cursor, match.index).trim()) reject({ reason: "INVALID_ATTRIBUTE" });
      cursor = attrPattern.lastIndex;
      const attr = match[1];
      const attrName = attr.toLowerCase();
      const value = match[2].slice(1, -1);
      if (attrName.startsWith("on") || !ALLOWED_ATTRIBUTES.has(attrName)) reject({ reason: "ATTRIBUTE_NOT_ALLOWED", attribute: attr });
      if (/javascript:|data:|vbscript:|url\s*\(/i.test(value)) reject({ reason: "UNSAFE_ATTRIBUTE", attribute: attr });
      attrs.push(`${attrName}="${value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`);
    }
    if (rawAttrs.slice(cursor).replace(/\/$/, "").trim()) reject({ reason: "INVALID_ATTRIBUTE" });
    const selfClosing = /\/\s*$/.test(rawAttrs);
    if (!selfClosing) tags.push(name);
    return `<${name}${attrs.length ? ` ${attrs.join(" ")}` : ""}${selfClosing ? " /" : ""}>`;
  });

  const roots = output.match(/<svg(?:\s|>)/gi) ?? [];
  const closes = output.match(/<\/svg>/gi) ?? [];
  if (roots.length !== 1 || closes.length !== 1 || !/^<svg(?:\s|>)/i.test(output) || tags.length || !/<\/svg>\s*$/i.test(output)) reject({ reason: "INVALID_DOCUMENT" });
  return output;
}

/** Backwards-compatible name used by the currency service and DTO transform. */
export const cleanSvgContent = sanitizeSvgContent;
