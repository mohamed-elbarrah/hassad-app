import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OverviewChartCardProps = {
  title: string;
  description: string;
  periodLabel: string;
  summary: ReactNode;
  children: ReactNode;
};

export function OverviewChartCard({
  title,
  description,
  periodLabel,
  summary,
  children,
}: OverviewChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <CardAction>
          <Badge variant="outline">{periodLabel}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {summary}
        {children}
      </CardContent>
    </Card>
  );
}
