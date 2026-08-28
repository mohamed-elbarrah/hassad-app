// apps/web/hooks/useCurrency.ts
import { useMemo } from "react";
import { useGetDefaultCurrencyQuery } from "@/features/settings/settingsApi";
import type { CurrencySymbolType } from "@/features/settings/settingsApi";
import {
  DEFAULT_LOCALE,
  formatCurrencyAmount,
  formatNumber,
  type CurrencyPresentation,
  type CurrencyReference,
} from "@/lib/currency";

export interface CurrencyConfig extends CurrencyPresentation {
  name: string;
  symbolType: CurrencySymbolType;
  /** Durable source: URL, inline markup, or private upload reference. */
  svgKey?: string | null;
  /** Resolved presentation URL; never submitted as a source. */
  svgUrl?: string | null;
  svgWidth?: number | null;
  svgHeight?: number | null;
  isDefault: boolean;
  /** Retained from settings metadata; display amounts are already denominated in code. */
  exchangeRate: number;
}

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
  const {
    data: setting,
    isLoading,
    isError,
    error,
  } = useGetDefaultCurrencyQuery(undefined);

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

  const fmtAmount = (
    amount: number | undefined | null,
    displayCurrency: CurrencyReference = currency,
  ): string => formatCurrencyAmount(amount, displayCurrency);

  const fmtNumber = (n: number | undefined | null): string =>
    formatNumber(n, DEFAULT_LOCALE);

  return {
    currency,
    isLoading,
    isError,
    error,
    fmtAmount,
    fmtNumber,
  };
}
