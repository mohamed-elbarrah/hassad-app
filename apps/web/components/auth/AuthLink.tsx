"use client";

import NextLink from "next/link";
import { cn } from "@/lib/utils";

interface AuthLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function Link({ href, children, className }: AuthLinkProps) {
  return (
    <NextLink
      href={href}
      className={cn(
        "inline-flex items-center justify-center h-9 px-4 text-sm font-medium",
        "rounded-full border border-neutral-200 bg-white text-secondary-500",
        "hover:bg-neutral-100 hover:border-neutral-300 transition-colors duration-200",
        className,
      )}
    >
      {children}
    </NextLink>
  );
}
