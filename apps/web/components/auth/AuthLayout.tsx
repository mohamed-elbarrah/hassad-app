"use client";

import React from "react";
import { AuthCarousel } from "./AuthCarousel";

interface AuthLayoutProps {
  children: React.ReactNode;
  showCarousel?: boolean;
}

export function AuthLayout({ children, showCarousel = true }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-white" dir="rtl">
      {/* Left Panel — Marketing Carousel (hidden on mobile) */}
      {showCarousel && (
        <div className="hidden lg:flex lg:w-1/2 bg-[#F5F5F7] items-center justify-center p-12">
          <AuthCarousel />
        </div>
      )}

      {/* Right Panel — Form Area */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[480px]">{children}</div>
      </div>
    </div>
  );
}
