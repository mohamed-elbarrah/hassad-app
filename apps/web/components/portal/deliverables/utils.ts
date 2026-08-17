/**
 * Deliverables-feature re-exports from the shared format module.
 *
 * Kept so existing imports (`from "@/components/portal/deliverables"`)
 * continue to work without touching call sites, but the canonical
 * implementations now live in `@/lib/format` (single source of truth).
 */
export {
  formatPortalDate,
  formatFileSize,
  formatRelativeTime as formatRelative,
} from "@/lib/format";
