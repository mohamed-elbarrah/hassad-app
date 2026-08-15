import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/components/app/app-providers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Hassad",
  description: "Operational workspace for Hassad teams and clients",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE);
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction} className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans">
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
