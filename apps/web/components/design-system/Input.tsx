import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type InputSize = "sm" | "md" | "lg";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  icon?: ReactNode;
  /**
   * Visible height of the bordered wrapper. Use this to align the input
   * with neighboring controls (e.g. buttons). The internal `<input>`
   * always fills the wrapper, so callers should never need to set
   * `h-*` on the input itself.
   */
  size?: InputSize;
  /** Styles applied to the outer wrapper (the bordered box). */
  className?: string;
}

const SIZE_MAP: Record<InputSize, string> = {
  sm: "h-8 text-sm",
  md: "h-9 text-sm",
  lg: "h-10 text-sm",
};

/**
 * Standard text input with optional leading icon.
 *
 * Single `className` prop styles the visible wrapper — the bordered,
 * padded box that the user sees and clicks. The internal `<input>` is
 * styled by the primitive itself, so callers don't need to think about
 * which element they're targeting.
 *
 * Use `size` to control the wrapper's height; use `className` for layout
 * (width, margin) and visual overrides (border color, background). This
 * matches the pattern of `ActionButton` and other design-system inputs.
 */
export function Input({ icon, size = "md", className, ...props }: InputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 px-3",
        SIZE_MAP[size],
        className,
      )}
    >
      {icon && <span className="shrink-0 text-portal-icon">{icon}</span>}
      <input
        className="h-full min-w-0 flex-1 bg-transparent outline-none text-right text-natural-100 placeholder:text-neutral-300"
        {...props}
      />
    </div>
  );
}
