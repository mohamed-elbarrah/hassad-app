import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li data-slot="pagination-item" className={cn(className)} {...props} />
  );
}

type PaginationLinkProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
};

function PaginationLink({
  className,
  isActive,
  type = "button",
  ...props
}: PaginationLinkProps) {
  return (
    <button
      data-slot="pagination-link"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
        }),
        "px-3",
        isActive && "pointer-events-none",
        className,
      )}
      type={type}
      {...props}
    />
  );
}

type PaginationDirection = "ltr" | "rtl";

type DirectionalPaginationProps = React.ComponentProps<
  typeof PaginationLink
> & {
  direction?: PaginationDirection;
  text?: string;
};

function PaginationPrevious({
  className,
  direction = "ltr",
  text = "Previous",
  ...props
}: DirectionalPaginationProps) {
  const Icon = direction === "rtl" ? ChevronRight : ChevronLeft;
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn("gap-1", className)}
      {...props}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  direction = "ltr",
  text = "Next",
  ...props
}: DirectionalPaginationProps) {
  const Icon = direction === "rtl" ? ChevronLeft : ChevronRight;
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn("gap-1", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <Icon className="h-4 w-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
