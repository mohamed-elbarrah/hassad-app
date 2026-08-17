"use client";

import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface AdminDetailBreadcrumbProps {
  backHref: string;
  backLabel: string;
  title: string;
  parentHref?: string;
  parentLabel?: string;
}

export function AdminDetailBreadcrumb({
  backHref,
  backLabel,
  title,
  parentHref,
  parentLabel,
}: AdminDetailBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={backHref}>{backLabel}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {parentHref && parentLabel && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={parentHref}>{parentLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <span className="truncate max-w-[200px]">{title}</span>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
