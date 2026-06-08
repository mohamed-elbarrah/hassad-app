import type { ReactNode } from "react";
import {
  Dialog as BaseDialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Block closing on outside click (e.g. mandatory forms). */
  onInteractOutside?: (e: Event) => void;
  /** Block closing on Escape key (e.g. mandatory forms). */
  onEscapeKeyDown?: (e: KeyboardEvent) => void;
  /** Override the internal X close button visibility. */
  hideClose?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  onInteractOutside,
  onEscapeKeyDown,
  hideClose,
}: DialogProps) {
  return (
    <BaseDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0 p-0 sm:max-w-[425px]",
          contentClassName,
        )}
        dir="rtl"
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        {hideClose && (
          <style>{`[data-radix-dialog-close] { display: none !important; }`}</style>
        )}
        {(title || description) && (
          <DialogHeader className="px-5 pt-5 text-right">
            {title && <DialogTitle className="text-xl">{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <div
          className={cn(
            "px-5",
            title || description ? "pt-2" : "pt-5",
            className,
          )}
        >
          {children}
        </div>
        {footer && (
          <DialogFooter className="px-5 pb-5 sm:justify-start">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </BaseDialog>
  );
}
