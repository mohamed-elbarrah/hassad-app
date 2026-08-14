"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";

import { ApiRefreshIndicator } from "@/components/app/api-refresh-indicator";
import { ThemeProvider } from "@/components/app/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "@/lib/store";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <TooltipProvider>
          {children}
          <ApiRefreshIndicator />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </Provider>
  );
}
