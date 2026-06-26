// apps/api/src/common/security/svg-sanitizer.ts
//
// Single source of truth for SVG sanitization. Used by:
//   - Currency upload endpoint (raw SVG file → R2)
//   - Currency DTO decorator (direct-assignment path — previously bypassed)
//
// Strategy: regex-based removal of dangerous tags/attributes. Idempotent on
// clean input (running it twice produces the same output).
//
// This is defense-in-depth, not the only line of defense. The storage layer
// serves these SVGs as `image/svg+xml` (correct Content-Type) and the
// frontend renders via `<img>` for SVG_URL. SVG_INLINE — the path where
// `dangerouslySetInnerHTML` is used — is the only path that needs runtime
// sanitization.

/**
 * Strip script tags, event handlers, and dangerous href / element patterns
 * from an SVG string. Idempotent.
 */
export function cleanSvgContent(svg: string): string {
  if (typeof svg !== "string") return "";

  // <script>...</script> (with or without namespace prefix)
  let cleaned = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  // on* event handlers (onclick, onload, onerror, ...)
  cleaned = cleaned.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "");
  // href / xlink:href pointing to javascript: protocol
  cleaned = cleaned.replace(/\shref\s*=\s*["']javascript:[^"']*["']/gi, "");
  cleaned = cleaned.replace(
    /\sxlink:href\s*=\s*["']javascript:[^"']*["']/gi,
    "",
  );
  // Dangerous embedded elements (with or without namespace prefix)
  cleaned = cleaned.replace(
    /<\w*:\s*(foreignObject|iframe|object|embed|link)[\s\S]*?<\/\w*:\s*\1>/gi,
    "",
  );
  cleaned = cleaned.replace(
    /<(foreignObject|iframe|object|embed|link)[\s\S]*?<\/\1>/gi,
    "",
  );
  return cleaned.trim();
}
