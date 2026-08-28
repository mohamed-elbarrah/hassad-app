"use client";

import type { ReactNode } from "react";
import {
  Select as BaseSelect,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
  triggerClassName?: string;
  disabled?: boolean;
  id?: string;
  label?: string;
  error?: string;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  placeholder,
  children,
  triggerClassName,
  disabled,
  id,
  label,
  error,
}: SelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-secondary-500 text-right">
          {label}
        </label>
      )}
      <BaseSelect
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm text-secondary-500",
            "focus:ring-1 focus:ring-secondary-500/20 focus:border-secondary-500",
            "data-[placeholder]:text-neutral-200",
            "transition-colors duration-200",
            error &&
              "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20",
            triggerClassName,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-neutral-200 bg-white">
          {children}
        </SelectContent>
      </BaseSelect>
      {error && <p className="text-xs text-danger-500 text-right">{error}</p>}
    </div>
  );
}

export { SelectItem } from "@/components/ui/select";
