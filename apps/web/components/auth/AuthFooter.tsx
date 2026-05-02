"use client";

import NextLink from "next/link";
import { cn } from "@/lib/utils";

interface AuthFooterProps {
  text: string;
  buttonText: string;
  href: string;
}

export function AuthFooter({ text, buttonText, href }: AuthFooterProps) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-300">{text}</span>
          <NextLink
            href={href}
            className={cn(
              "inline-flex items-center justify-center h-9 px-4 text-sm font-medium",
              "rounded-full border border-neutral-200 bg-white text-secondary-500",
              "hover:bg-neutral-100 hover:border-neutral-300 transition-colors duration-200",
            )}
          >
            {buttonText}
          </NextLink>
        </div>

        <span className="text-xs text-neutral-200">© نظام مسار 2026</span>
      </div>
    </div>
  );
}
