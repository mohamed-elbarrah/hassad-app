/**
 * Formats numeric values using Latin digits without grouping separators.
 *
 * API responses should normally return numbers as numbers. This helper is
 * reserved for the few backend-generated human-readable strings that still
 * need to contain a number.
 */
export function formatPlainNumber(value: number | string): string {
  return String(value);
}
