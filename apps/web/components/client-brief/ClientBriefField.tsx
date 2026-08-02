"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientBriefFieldProps {
  icon: LucideIcon;
  label: string;
  value?: React.ReactNode;
  dir?: "rtl" | "ltr";
  href?: string;
  className?: string;
}

export function ClientBriefField({
  icon: Icon,
  label,
  value,
  dir = "rtl",
  href,
  className,
}: ClientBriefFieldProps) {
  if (value == null || value === "" || value === undefined) return null;

  const content = (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </p>
        <p
          className={cn(
            "text-sm font-medium text-foreground mt-0.5",
            href && "text-primary hover:underline cursor-pointer",
          )}
          dir={dir}
        >
          {value}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}
