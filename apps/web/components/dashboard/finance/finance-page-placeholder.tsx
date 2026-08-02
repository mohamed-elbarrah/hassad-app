import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface FinancePagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function FinancePagePlaceholder({
  title,
  description,
  icon: Icon,
}: FinancePagePlaceholderProps) {
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon />
            </div>
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <Empty className="min-h-64">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>قيد التطوير</EmptyTitle>
            <EmptyDescription>
              سيتم إضافة محتوى هذا القسم في التصميم القادم.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    </main>
  );
}