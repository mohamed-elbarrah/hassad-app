import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/providers/Providers";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Hassad Platform",
  description: "Full-stack SaaS platform for marketing agencies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <Providers>
          <AuthInitializer>{children}</AuthInitializer>
        </Providers>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
