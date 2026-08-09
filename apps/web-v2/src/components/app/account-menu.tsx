"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon, SettingsIcon, UserRoundIcon } from "lucide-react";

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
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" />}>
        <Avatar size="sm">
          <AvatarFallback>{getInitials(session.name)}</AvatarFallback>
        </Avatar>
        <span className="sr-only">Open account menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block text-foreground">{session.name}</span>
          <span className="block truncate font-normal">{session.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
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
        <DropdownMenuItem onClick={() => void handleSignOut()}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
