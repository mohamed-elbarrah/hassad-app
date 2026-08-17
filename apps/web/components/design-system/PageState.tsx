import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { EmptyState, ErrorState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

interface PageStateProps {
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  errorTitle?: string;
  onRetry?: () => void;
  children: ReactNode;
}

export function PageState({
  loading = false,
  error = false,
  empty = false,
  emptyTitle = "لا توجد بيانات",
  emptyHint,
  errorTitle,
  onRetry,
  children,
}: PageStateProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState title={errorTitle} onRetry={onRetry} />;
  }

  if (empty) {
    return <EmptyState icon={Inbox} title={emptyTitle} hint={emptyHint} />;
  }

  return <>{children}</>;
}
