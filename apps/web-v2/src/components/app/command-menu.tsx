"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function CommandMenu({
  commands,
  workspaceLabel,
}: {
  commands: Array<{ label: string; href: string }>;
  workspaceLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <SearchIcon data-icon="inline-start" />
        <span className="hidden sm:inline">Search</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search workspace commands" />
          <CommandList>
            <CommandEmpty>No command found.</CommandEmpty>
            <CommandGroup heading={workspaceLabel}>
              {commands.map((command) => (
                <CommandItem key={command.href} onSelect={() => setOpen(false)}>
                  <Link href={command.href} className="w-full">
                    {command.label}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
