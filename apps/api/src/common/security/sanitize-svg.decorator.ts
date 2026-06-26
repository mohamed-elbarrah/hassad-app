// apps/api/src/common/security/sanitize-svg.decorator.ts
//
// Property-level DTO decorator that runs the input through `cleanSvgContent`
// before validation. This closes the gap where a caller POSTing raw SVG
// content via JSON to a Create/Update endpoint would bypass the sanitizer
// (which only ran in the file-upload path).
//
// Apply with:  @SanitizeSvg() svgKey?: string;

import { Transform } from "class-transformer";
import { cleanSvgContent } from "./svg-sanitizer";

export function SanitizeSvg() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    if (typeof value !== "string") return value;
    return cleanSvgContent(value);
  });
}
