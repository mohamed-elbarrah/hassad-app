"use client";

import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useLogoutMutation } from "@/features/auth/authApi";
import { logout } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function SidebarAccountMenu({ settingsHref }: { settingsHref: string }) {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [logoutMutation] = useLogoutMutation();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Local sign-out must still complete when the remote session is unavailable.
    }
    dispatch(logout());
    router.replace("/login");
  };

  return (
    <SidebarFooter className="shrink-0 border-t border-sidebar-border p-2">
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto min-h-11 w-full justify-start gap-3 rounded-lg px-2 py-2 text-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
            aria-label={user.name}
            title={state === "collapsed" ? user.name : undefined}
          >
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
              {user.name}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="shrink-0 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-60">
          <DropdownMenuLabel className="flex min-w-0 flex-col gap-1">
            <span className="truncate">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="min-h-11"
              onSelect={() => {
                if (isMobile) setOpenMobile(false);
                router.push(settingsHref);
              }}
            >
              <Settings data-icon="inline-start" />
              الإعدادات
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" onSelect={handleLogout}>
              <LogOut data-icon="inline-start" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  );
}
