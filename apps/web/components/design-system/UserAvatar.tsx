"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarVariant = "circle" | "rounded" | "square";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  variant?: AvatarVariant;
  showBorder?: boolean;
  className?: string;
}

const sizeConfig: Record<
  AvatarSize,
  { width: number; height: number; fontSize: string; borderRadius: string }
> = {
  sm: {
    width: 40,
    height: 40,
    fontSize: "text-xs",
    borderRadius: "rounded-lg",
  },
  md: {
    width: 50,
    height: 50,
    fontSize: "text-sm",
    borderRadius: "rounded-xl",
  },
  lg: {
    width: 60,
    height: 60,
    fontSize: "text-base",
    borderRadius: "rounded-xl",
  },
  xl: {
    width: 64,
    height: 64,
    fontSize: "text-lg",
    borderRadius: "rounded-xl",
  },
};

const variantConfig: Record<AvatarVariant, string> = {
  circle: "rounded-full",
  rounded: "rounded-xl",
  square: "rounded-none",
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  variant = "circle",
  showBorder = false,
  className,
}: UserAvatarProps) {
  const config = sizeConfig[size];
  const variantClass = variantConfig[variant];

  return (
    <Avatar
      className={cn("shrink-0", variantClass, className)}
      style={{
        width: config.width,
        height: config.height,
        ...(showBorder && { border: "1.5px solid #E4E7EC" }),
      }}
    >
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt={name} className={variantClass} />
      )}
      <AvatarFallback
        className={cn(variantClass, config.fontSize, "font-semibold")}
        style={{
          backgroundColor: "#121936",
          color: "#fff",
        }}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

// Specialized component for displaying user info with avatar
interface UserInfoCardProps {
  name: string;
  email?: string;
  avatarUrl?: string | null;
  showVerified?: boolean;
  size?: AvatarSize;
  className?: string;
  onAvatarClick?: () => void;
  isUploading?: boolean;
}

export function UserInfoCard({
  name,
  email,
  avatarUrl,
  showVerified = false,
  size = "lg",
  className,
  onAvatarClick,
  isUploading = false,
}: UserInfoCardProps) {
  const AvatarWrapper = onAvatarClick ? "button" : "div";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <AvatarWrapper
        type={onAvatarClick ? "button" : undefined}
        onClick={onAvatarClick}
        disabled={isUploading}
        className={cn(
          "relative shrink-0",
          onAvatarClick && "group cursor-pointer",
        )}
      >
        <UserAvatar
          name={name}
          avatarUrl={avatarUrl}
          size={size}
          variant="circle"
        />
        {/* Upload overlay - only shown when onAvatarClick is provided */}
        {onAvatarClick && (
          <>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
              <Camera className="w-6 h-6 text-white" />
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </>
        )}
      </AvatarWrapper>
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center gap-1.5">
          <span
            className="truncate font-semibold"
            style={{
              fontSize: size === "lg" ? 22 : 18,
              fontWeight: 600,
              lineHeight: size === "lg" ? "33px" : "27px",
              color: "#000000",
            }}
          >
            {name}
          </span>
          {showVerified && (
            <svg
              width={size === "lg" ? 22 : 18}
              height={size === "lg" ? 22 : 18}
              viewBox="0 0 22 22"
              fill="none"
              className="shrink-0"
            >
              <circle cx="11" cy="11" r="10" fill="#00AEFF" />
              <path
                d="M6 11L9.5 14.5L16 8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        {email && (
          <p
            className="truncate mt-0.5"
            style={{
              fontSize: size === "lg" ? 16 : 14,
              fontWeight: 400,
              lineHeight: size === "lg" ? "24px" : "21px",
              color: "rgba(0, 0, 0, 0.6)",
            }}
          >
            {email}
          </p>
        )}
      </div>
    </div>
  );
}

// Compact version for header usage
interface UserHeaderDisplayProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}

export function UserHeaderDisplay({
  name,
  avatarUrl,
  className,
}: UserHeaderDisplayProps) {
  const firstName = name?.split(" ")[0] ?? "";

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* <UserAvatar
        name={name}
        avatarUrl={avatarUrl}
        size="lg"
        variant="circle"
        showBorder
      /> */}
      <div className="text-right hidden md:block">
        <p
          style={{
            fontSize: 26,
            fontWeight: 600,
            lineHeight: "39px",
            color: "#000000",
          }}
        >
          مرحبًا {firstName}
        </p>
        <p
          style={{
            fontSize: 20,
            fontWeight: 400,
            lineHeight: "30px",
            color: "#525866",
          }}
        >
          مشروعك يسير بشكل جيد 🚀
        </p>
      </div>
    </div>
  );
}
