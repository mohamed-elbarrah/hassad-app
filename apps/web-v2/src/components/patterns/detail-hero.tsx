import type { ReactNode } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DetailHeroProps = {
  title: string;
  description: string;
  media?: ReactNode;
  badges?: ReactNode;
  metadata: Array<{
    label: string;
    value: ReactNode;
  }>;
  actions?: ReactNode;
  aside?: ReactNode;
};

export function DetailHero({
  title,
  description,
  media,
  badges,
  metadata,
  actions,
  aside,
}: DetailHeroProps) {
  return (
    <Card>
      <CardHeader>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                {media}
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle className="truncate text-2xl">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                  {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
                </div>
              </div>
              {actions ? <CardAction>{actions}</CardAction> : null}
            </div>
            <CardContent className="px-0">
              <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metadata.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1 rounded-lg border p-3">
                    <dt className="text-sm text-muted-foreground">{item.label}</dt>
                    <dd className="font-medium">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </div>
          {aside ? <CardContent className="rounded-lg border bg-muted/30">{aside}</CardContent> : null}
        </div>
      </CardHeader>
    </Card>
  );
}
