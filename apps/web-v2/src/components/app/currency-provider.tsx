"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useGetAdminSettingsQuery } from "@/lib/api/admin-settings-api";
import { DEFAULT_CURRENCY, resolveCurrency, type CurrencyCode } from "@/lib/currency";

type CurrencyContextValue = {
  currency: CurrencyCode;
  isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/login" || pathname === "/" || pathname.startsWith("/chat-preview");
  const { data, isLoading } = useGetAdminSettingsQuery(undefined, { skip: isPublicRoute });
  const currency = resolveCurrency(data?.defaultCurrency ?? DEFAULT_CURRENCY);

  const value = useMemo(() => ({ currency, isLoading }), [currency, isLoading]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
}
