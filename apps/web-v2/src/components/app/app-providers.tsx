"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";

import { ApiRefreshIndicator } from "@/components/app/api-refresh-indicator";
import { LocaleProvider } from "@/components/app/locale-provider";
import type { Locale } from "@/lib/i18n";
import { ThemeProvider } from "@/components/app/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "@/lib/store";

export function AppProviders({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  return (
    <Provider store={store}>
      <LocaleProvider initialLocale={locale}>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <ApiRefreshIndicator />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </LocaleProvider>
    </Provider>
  );
}
