"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";
import { UserInfoCard } from "./UserAvatar";

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <button className="w-full text-right cursor-pointer focus:outline-none focus:ring-0">
          <UserInfoCard
            name={user.name}
            email={user.email}
            avatarUrl={user.avatarUrl}
            showVerified={true}
            size="lg"
            className="py-2"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={8}
        style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
        className="rounded-xl p-2 border-[1.5px] border-portal-card-border bg-natural-0"
      >
        <DropdownMenuItem
          className="rounded-lg py-3 px-3 cursor-pointer text-base"
          onClick={() => router.push("/portal/account")}
        >
          <Settings className="text-portal-icon" />
          <span className="text-portal-icon font-medium transition-colors">
            الاعدادات
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-portal-divider" />
        <DropdownMenuItem
          className="rounded-lg py-3 px-3 cursor-pointer text-base"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" style={{ color: "#FF6161" }} />
          <span
            className="font-medium transition-colors"
            style={{ color: "#FF6161" }}
          >
            تسجيل الخروج
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
