// apps/web/hooks/useCurrency.ts
import { useMemo } from "react";
import {
  useGetDefaultCurrencyQuery,
  type CurrencySymbolType,
} from "@/features/settings/settingsApi";

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  symbolType: CurrencySymbolType;
  /** External URL for SVG_URL; storage keys are never renderable values. */
  svgKey?: string | null;
  /** Resolved URL for an uploaded asset. */
  svgUrl?: string | null;
  svgWidth?: number | null;
  svgHeight?: number | null;
  isDefault: boolean;
  exchangeRate: number;
}

const LOCALE = "ar-SA-u-nu-latn";

const DEFAULT_CURRENCY: CurrencyConfig = {
  code: "SAR",
  name: "ريال سعودي",
  symbol: "ر.س",
  symbolType: "TEXT",
  svgKey: null,
  svgUrl: null,
  svgWidth: null,
  svgHeight: null,
  isDefault: true,
  exchangeRate: 1,
};

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
            // The default endpoint returns a short-lived URL for uploaded
            // symbols. Keep it separate from svgKey: the latter is absent
            // from that endpoint by design.
            svgUrl: setting.svgUrl ?? null,
            svgWidth: setting.svgWidth,
            svgHeight: setting.svgHeight,
            isDefault: setting.isDefault,
            exchangeRate: setting.exchangeRate,
          }
        : DEFAULT_CURRENCY,
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
