"use client";

import { DetailErrorState } from "@/components/portal/shared/DetailErrorState";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ArrowRight } from "lucide-react";

interface FinanceDetailErrorProps {
  title?: string;
  hint?: string;
  backHref?: string;
  backLabel?: string;
}

export function FinanceDetailError({
  title = "عذراً، لم يتم العثور على البيانات",
  hint,
  backHref = "/dashboard/finance",
  backLabel = "العودة للوحة المالية",
}: FinanceDetailErrorProps) {
  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <ActionButton variant="ghost" size="sm" className="gap-2 w-fit" href={backHref}>
        <ArrowRight className="h-4 w-4" />
        {backLabel}
      </ActionButton>
      <DetailErrorState title={title} backHref={backHref} backLabel={backLabel} />
    </div>
  );
}
