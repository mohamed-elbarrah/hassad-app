"use client";

import Link from "next/link";
import { BellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notifications } from "@/lib/fixtures/first-slice";

export function NotificationMenu({ workspaceLabel }: { workspaceLabel: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" />}>
        <BellIcon />
        <span className="sr-only">Open notifications</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          <span className="block text-foreground">Notifications</span>
          <span className="block font-normal">Latest {workspaceLabel} events</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {notifications.map((notification) => (
            <DropdownMenuItem key={notification.title} render={<Link href={notification.href} />}>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-medium">{notification.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {notification.summary}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
