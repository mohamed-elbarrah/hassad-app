// apps/web/hooks/useCurrency.ts
import { useMemo } from "react";
import { useGetDefaultCurrencyQuery } from "@/features/settings/settingsApi";

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  symbolType: "TEXT" | "SVG_URL" | "SVG_INLINE";
  svgKey?: string | null;
  svgWidth?: number | null;
  svgHeight?: number | null;
  isDefault: boolean;
  exchangeRate: number;
}

const LOCALE = "ar-SA-u-nu-latn";

export function useCurrency() {
  const { data: setting, isLoading } = useGetDefaultCurrencyQuery(undefined);

  const currency: CurrencyConfig = useMemo(
    () =>
      setting
        ? {
            code: setting.code,
            name: setting.name,
            symbol: setting.symbol,
            symbolType: setting.symbolType,
            svgKey: setting.svgKey,
            svgWidth: setting.svgWidth,
            svgHeight: setting.svgHeight,
            isDefault: setting.isDefault,
            exchangeRate: setting.exchangeRate,
          }
        : {
            code: "SAR",
            name: "ريال سعودي",
            symbol: "ر.س",
            symbolType: "TEXT" as const,
            svgKey: null,
            svgWidth: null,
            svgHeight: null,
            isDefault: true,
            exchangeRate: 1,
          },
    [setting],
  );

  const fmtAmount = (amount: number | undefined | null): string => {
    if (amount == null) return "—";
    const value = amount * currency.exchangeRate;
    return new Intl.NumberFormat(LOCALE, {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const fmtNumber = (n: number | undefined | null): string => {
    if (n == null) return "—";
    try {
      return new Intl.NumberFormat(LOCALE).format(n);
    } catch {
      return String(n);
    }
  };

  return {
    currency,
    isLoading,
    fmtAmount,
    fmtNumber,
  };
}
