"use client";

import { HexColorPicker, HexColorInput } from "react-colorful";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-9 w-9 cursor-pointer rounded-lg border",
              value.toLowerCase() === "#ffffff"
                ? "border-border"
                : "border-transparent",
            )}
            style={{ backgroundColor: value }}
          />
        </PopoverTrigger>
        <PopoverContent align="end" className="flex flex-col gap-3 p-3">
          <HexColorPicker color={value} onChange={onChange} />
          <HexColorInput
            color={value}
            onChange={onChange}
            prefixed
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-right text-sm text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </PopoverContent>
      </Popover>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -right-1 -top-1 rounded-full border border-border bg-background p-0.5 text-muted-foreground shadow-sm transition-colors hover:text-danger-600"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
