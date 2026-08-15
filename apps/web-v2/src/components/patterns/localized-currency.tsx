"use client";

import { useLocale } from "@/components/app/locale-provider";
import { useCurrency } from "@/components/app/currency-provider";
import { currencyLabel, resolveCurrency, type CurrencyCode } from "@/lib/currency";
import { formatLocalizedNumber } from "@/lib/i18n";

function resolveAmount(value: number | string): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = value.replace(/[^\d.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function LocalizedCurrency({
  amount,
  currency,
}: {
  amount: number | string;
  currency?: CurrencyCode | string | null;
}) {
  const { locale } = useLocale();
  const { currency: settingsCurrency } = useCurrency();
  const resolvedAmount = resolveAmount(amount);
  if (resolvedAmount === null) return <span>{String(amount)}</span>;

  const resolvedCurrency = resolveCurrency(currency ?? settingsCurrency);
  const formattedAmount = formatLocalizedNumber(resolvedAmount, locale);
  const label = currencyLabel(resolvedCurrency, locale);

  return (
    <span dir="ltr" className="inline-flex items-baseline gap-1 whitespace-nowrap">
      {locale === "ar" ? (
        <>
          <span dir="rtl">{label}</span>
          <span>{formattedAmount}</span>
        </>
      ) : (
        <>
          <span>{formattedAmount}</span>
          <span>{label}</span>
        </>
      )}
    </span>
  );
}
