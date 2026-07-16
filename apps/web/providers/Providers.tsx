"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { DirectionProvider } from "@radix-ui/react-direction";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <DirectionProvider dir="rtl">{children}</DirectionProvider>
    </Provider>
  );
}
