"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthButtonVariant = "primary" | "outline" | "ghost" | "social";

interface AuthButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  "variant"
> {
  variant?: AuthButtonVariant;
  fullWidth?: boolean;
}

export const AuthButton = React.forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ variant = "primary", fullWidth = false, className, ...props }, ref) => (
    <Button
      ref={ref}
      variant={
        variant === "primary"
          ? "default"
          : variant === "social"
            ? "outline"
            : variant
      }
      className={cn(
        "h-12 rounded-xl",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        variant === "outline" &&
          "border-input bg-background text-foreground hover:bg-accent hover:border-input",
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  ),
);
AuthButton.displayName = "AuthButton";
