"use client";

import { PageIntro } from "@/components/design-system/PageIntro";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface FinancePageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function FinancePageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: FinancePageHeaderProps) {
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
