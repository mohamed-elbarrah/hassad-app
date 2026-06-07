"use client";

import { BadgeCheck, ChevronsUpDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { UserAvatar } from "@/components/design-system/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logout } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import { UserRole } from "@hassad/shared";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logoutMutation] = useLogoutMutation();

  if (!user) return null;

  async function handleLogout() {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Even if API fails, clear local state
    }
    dispatch(logout());
    // Force a full page reload to clear any cached state
    window.location.href = "/login";
  }

  function handleAccount() {
    const isClient = user?.role === UserRole.CLIENT;
    router.push(isClient ? "/portal/account" : "/dashboard/account");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className=" data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar name={user.name} size="sm" variant="rounded" />
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-neutral-300">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center  gap-2 px-1 py-1.5 text-right text-sm">
                <div className="grid flex-1 text-right text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-neutral-300">
                    {user.email}
                  </span>
                </div>
                <UserAvatar name={user.name} size="sm" variant="rounded" />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleAccount}
                className="cursor-pointer"
                dir="rtl"
              >
                <BadgeCheck className="size-4" />
                إدارة الحساب
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-danger-500 focus:text-danger-500"
              dir="rtl"
            >
              <LogOut className="size-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
