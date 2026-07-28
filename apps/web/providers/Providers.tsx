"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { DirectionProvider } from "@radix-ui/react-direction";

import { store } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <DirectionProvider dir="rtl">{children}</DirectionProvider>
      </ThemeProvider>
    </Provider>
  );
}
