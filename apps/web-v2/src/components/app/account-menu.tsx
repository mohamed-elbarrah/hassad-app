"use client";

import { useRouter } from "next/navigation";
import { ChevronRightIcon, LogOutIcon, SettingsIcon, UserRoundIcon } from "lucide-react";

import type { AuthSession } from "@/lib/auth/auth-types";
import { getInitials } from "@/lib/auth/auth-utils";
import { clearSession } from "@/lib/auth/auth-slice";
import { useLogoutMutation } from "@/lib/api/auth-api";
import { baseApi } from "@/lib/api/base-api";
import { useAppDispatch } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export function AccountMenu({ session }: { session: AuthSession }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout] = useLogoutMutation();

  async function handleSignOut() {
    try {
      await logout().unwrap();
    } finally {
      dispatch(clearSession());
      dispatch(baseApi.util.resetApiState());
      router.replace("/login");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="lg"
            className="h-12 w-full justify-start px-2 text-left group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            aria-label="Open account menu"
          />
        }
      >
        <Avatar size="default">
          <AvatarFallback>{getInitials(session.name)}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 group-data-[collapsible=icon]:hidden">
          <span className="max-w-full truncate">{session.name}</span>
          <span className="max-w-full truncate text-xs text-muted-foreground">
            {session.email}
          </span>
        </span>
        <ChevronRightIcon className="ml-auto group-data-[collapsible=icon]:hidden" />
        <span className="sr-only">Open account menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block text-foreground">{session.name}</span>
            <span className="block truncate font-normal">{session.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserRoundIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Workspace settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
