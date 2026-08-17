"use client";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface QuickLinkCardProps {
  href: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  className?: string;
}

export function QuickLinkCard({
  href,
  title,
  description,
  icon: Icon,
  className,
}: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-card border-[1.5px] border-portal-card-border bg-natural-0 p-5",
        "hover:bg-badge-gray-bg transition-colors duration-200",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-500/10">
        <Icon className="h-5 w-5 text-secondary-500" />
      </div>
      <div>
        <h3 className="font-medium text-natural-100">{title}</h3>
        {description && (
          <p className="text-sm text-neutral-300">{description}</p>
        )}
      </div>
    </Link>
  );
}
