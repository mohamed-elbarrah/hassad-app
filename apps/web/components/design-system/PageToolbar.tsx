import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageToolbarProps {
  children: ReactNode;
  className?: string;
}

export function PageToolbar({ children, className }: PageToolbarProps) {
  return (
    <div className={cn("page-toolbar", className)}>{children}</div>
  );
}
