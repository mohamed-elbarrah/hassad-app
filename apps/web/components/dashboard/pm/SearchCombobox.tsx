"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  id: string;
  label: string;
}

interface SearchComboboxProps {
  /** The currently selected ID */
  value: string;
  /** Called with the selected ID when the user picks an option */
  onChange: (id: string) => void;
  /** Options to display in the list */
  options: ComboboxOption[];
  /** Called when the search input changes — used to trigger API queries */
  onSearchChange: (search: string) => void;
  /** Placeholder text shown when nothing is selected */
  placeholder?: string;
  /** Placeholder for the search input inside the dropdown */
  searchPlaceholder?: string;
  /** Whether the options list is loading */
  isLoading?: boolean;
  /** Disable the whole combobox */
  disabled?: boolean;
}

/**
 * SearchCombobox — a searchable dropdown backed by server-side search.
 * The parent controls `onSearchChange` and passes filtered `options`.
 * Uses shadcn Command + Popover primitives.
 */
export function SearchCombobox({
  value,
  onChange,
  options,
  onSearchChange,
  placeholder = "اختر...",
  searchPlaceholder = "بحث...",
  isLoading = false,
  disabled = false,
}: SearchComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.id === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className={cn(!selectedLabel && "text-muted-foreground")}>
            {selectedLabel ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>جارٍ التحميل...</CommandEmpty>
            ) : options.length === 0 ? (
              <CommandEmpty>لا توجد نتائج</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
