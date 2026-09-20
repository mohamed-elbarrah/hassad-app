"use client";

import Image from "next/image";
import Link from "next/link";

import { SidebarHeader } from "@/components/ui/sidebar";

export function SidebarBrand({
  href,
  alt,
  subtitle,
}: {
  href: string;
  alt: string;
  subtitle: string;
}) {
  return (
    <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
      <Link
        href={href}
        className="flex min-h-11 min-w-0 w-full items-center gap-3 rounded-lg p-0 group-data-[collapsible=icon]:justify-center"
        aria-label="الرئيسية"
      >
        <span className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent">
          <Image
            src="/masar.svg"
            alt={alt}
            width={134}
            height={78}
            priority
            className="h-full w-full object-contain"
          />
        </span>
        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            Hassad Platform
          </p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            {subtitle}
          </p>
        </div>
      </Link>
    </SidebarHeader>
  );
}
