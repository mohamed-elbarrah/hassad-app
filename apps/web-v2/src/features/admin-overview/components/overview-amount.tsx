import { LocalizedCurrency } from "@/components/patterns/localized-currency";
import type { CurrencyCode } from "@/lib/currency";

export function OverviewAmount({
  value,
  currency,
}: {
  value: string;
  locale?: "en" | "ar";
  currency?: CurrencyCode;
}) {
  return <LocalizedCurrency amount={value} currency={currency} />;
}
