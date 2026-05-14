"use client";

import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PortalSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
  triggerClassName?: string;
  disabled?: boolean;
}

export function PortalSelect({
  value,
  defaultValue,
  onValueChange,
  placeholder,
  children,
  triggerClassName,
  disabled,
}: PortalSelectProps) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-4 text-base text-natural-100",
          "focus:ring-1 focus:ring-secondary-500/20 focus:border-secondary-500",
          "data-[placeholder]:text-portal-note-text/60",
          triggerClassName,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0">
        {children}
      </SelectContent>
    </Select>
  );
}
