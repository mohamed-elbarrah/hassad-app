"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthCarousel } from "./AuthCarousel";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const shouldShowCarousel = pathname !== "/reset-password";

  return (
    <div className="flex min-h-screen w-full bg-background" dir="rtl">
      {/* Left Panel — Marketing Carousel (hidden on mobile) */}
      {shouldShowCarousel && (
        <div className="hidden items-center justify-center bg-muted p-12 lg:flex lg:w-1/2">
          <AuthCarousel />
        </div>
      )}

      {/* Right Panel — Form Area */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
