"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/components/app/locale-provider";
import type { Locale } from "@/lib/i18n";

const languages: Array<{ value: Locale; label: string }> = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Change language" />}>
        <Languages data-icon="inline-start" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onClick={() => setLocale(language.value)}
            data-active={language.value === locale}
          >
            {language.label}
            {language.value === locale ? " ✓" : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
