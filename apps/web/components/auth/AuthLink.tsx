import type { ReactNode } from "react";
import NextLink from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function Link({ href, children, className }: AuthLinkProps) {
  return (
    <NextLink
      href={href}
      className={cn(
        buttonVariants({ variant: "link", size: "default" }),
        className,
      )}
    >
      {children}
    </NextLink>
  );
}
