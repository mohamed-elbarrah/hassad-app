import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <div className={`flex flex-col gap-6 p-6 ${className}`}>
      {children}
    </div>
  );
}