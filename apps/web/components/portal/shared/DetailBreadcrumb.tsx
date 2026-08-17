import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface DetailBreadcrumbProps {
  backHref: string;
  backLabel: string;
  title: string;
}

export function DetailBreadcrumb({
  backHref,
  backLabel,
  title,
}: DetailBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link
        href={backHref}
        className="flex items-center gap-1 transition-colors hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        {backLabel}
      </Link>
      <span aria-hidden="true">/</span>
      <span className="max-w-[300px] truncate font-medium text-foreground">
        {title}
      </span>
    </nav>
  );
}
