"use client";

import { HexColorPicker, HexColorInput } from "react-colorful";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover } from "./Popover";

interface ColorPickerControlProps {
  value: string;
  onChange: (color: string) => void;
  onRemove?: () => void;
}

export function ColorPickerControl({
  value,
  onChange,
  onRemove,
}: ColorPickerControlProps) {
  return (
    <div className="relative">
      <Popover
        align="end"
        trigger={
          <button
            type="button"
            className={cn(
              "w-9 h-9 rounded-lg border cursor-pointer",
              value.toLowerCase() === "#ffffff"
                ? "border-portal-divider"
                : "border-transparent",
            )}
            style={{ backgroundColor: value }}
          />
        }
        contentClassName="p-3 space-y-3"
      >
        <HexColorPicker color={value} onChange={onChange} />
        <HexColorInput
          color={value}
          onChange={onChange}
          prefixed
          className={cn(
            "w-full h-9 px-3 text-sm text-secondary-500 bg-white text-right",
            "border border-neutral-200 rounded-xl",
            "placeholder:text-neutral-200",
            "focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20",
            "transition-colors duration-200",
          )}
        />
      </Popover>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-natural-0 border border-portal-divider text-portal-icon hover:text-danger-500 transition-colors shadow-sm"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
