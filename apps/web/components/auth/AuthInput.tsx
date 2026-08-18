"use client";

import * as React from "react";
import { Mail, Lock, Eye, EyeOff, Phone, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthInputProps extends React.ComponentProps<typeof Input> {
  label: string;
  icon?: "mail" | "lock" | "phone" | "user";
  showPasswordToggle?: boolean;
  error?: string;
}

const icons = {
  mail: Mail,
  lock: Lock,
  phone: Phone,
  user: UserRound,
};

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      label,
      icon,
      showPasswordToggle = false,
      error,
      className,
      type,
      id,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = showPasswordToggle && showPassword ? "text" : type;
    const Icon = icon ? icons[icon] : null;

    return (
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor={id} className="text-right text-foreground">
          {label}
        </Label>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={inputType}
            aria-invalid={error ? true : undefined}
            className={cn(
              "h-12 rounded-xl bg-background text-sm text-foreground placeholder:text-muted-foreground text-right",
              "border-input focus-visible:border-primary focus-visible:ring-primary/20",
              Icon && "pr-12",
              showPasswordToggle && "pl-12",
              error && "border-destructive focus-visible:ring-destructive",
              className,
            )}
            {...props}
          />

          {Icon && (
            <Icon
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            />
          )}

          {showPasswordToggle && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={
                showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
              }
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute left-1 top-1/2 size-10 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
            </Button>
          )}
        </div>
        {error && (
          <p className="text-right text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  },
);
AuthInput.displayName = "AuthInput";
