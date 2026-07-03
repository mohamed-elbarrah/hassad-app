"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";

interface SalesPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

/**
 * Sales-specific page header.
 * Thin wrapper around `PageIntro` — keeps the same API so we can
 * add sales‑wide defaults later without touching every page.
 */
export function SalesPageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: SalesPageHeaderProps) {
  return (
    <PageIntro
      title={title}
      description={description}
      icon={icon}
      actions={actions}
      className={className}
    />
  );
}
