"use client";

import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
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
  headerClassName?: string;
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
  headerClassName,
  onInteractOutside,
  onEscapeKeyDown,
  hideClose = false,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] border-[1.5px] border-portal-card-border bg-natural-0 p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-[24px] flex flex-col overflow-hidden",
            contentClassName,
          )}
          dir="rtl"
          onInteractOutside={onInteractOutside}
          onEscapeKeyDown={onEscapeKeyDown}
        >
          {/* Close button - conditionally rendered */}
          {!hideClose && (
            <DialogPrimitive.Close className="absolute left-4 top-4 rounded-full p-2 opacity-70 transition-opacity hover:opacity-100 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 z-10">
              <X className="h-5 w-5 text-neutral-400" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
          
          {/* Header with title for accessibility */}
          {(title || description) && (
            <div className={cn("px-6 pt-6 pb-0 text-right", headerClassName)}>
              {title && (
                <DialogPrimitive.Title className="text-xl font-bold text-natural-100 leading-tight">
                  {title}
                </DialogPrimitive.Title>
              )}
              {/* Hidden title for accessibility when no visible title provided */}
              {!title && (
                <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          )}
          
          <div
            className={cn(
              "px-6 overflow-y-auto flex-1",
              title || description ? "pt-4" : "pt-6",
              footer ? "pb-4" : "pb-6",
              className,
            )}
          >
            {children}
          </div>
          
          {footer && (
            <div className="px-6 pb-6 pt-2 flex flex-col-reverse sm:flex-row sm:justify-start gap-3">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
