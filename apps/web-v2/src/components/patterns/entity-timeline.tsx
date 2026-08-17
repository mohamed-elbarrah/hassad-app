import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type EntityTimelineItem = {
  id: string;
  date: string;
  title: string;
  badges?: ReactNode;
  content?: ReactNode;
  meta?: ReactNode;
  completed?: boolean;
};

type EntityTimelineProps = {
  className?: string;
  items: EntityTimelineItem[];
};

export function EntityTimeline({
  className,
  items,
}: EntityTimelineProps) {
  return (
    <div
      data-orientation="vertical"
      data-slot="timeline"
      className={cn("group/timeline flex w-full flex-col", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div
            key={item.id}
            data-slot="timeline-item"
            data-completed={item.completed ? "true" : undefined}
            className="group/timeline-item relative ms-8 flex flex-1 flex-col gap-2 pb-6 last:pb-0 sm:ms-32"
          >
            {!isLast ? (
              <div
                aria-hidden="true"
                data-slot="timeline-separator"
                className="absolute -left-6 top-4 h-[calc(100%-0.25rem)] w-0.5 -translate-x-1/2 bg-border data-[completed=true]:bg-primary"
              />
            ) : null}

            <div data-slot="timeline-header" className="relative flex flex-col gap-2">
              <time
                data-slot="timeline-date"
                className="text-xs font-medium text-muted-foreground sm:absolute sm:-left-32 sm:w-20 sm:text-right"
              >
                {item.date}
              </time>
              <div
                aria-hidden="true"
                data-slot="timeline-indicator"
                className={cn(
                  "absolute -left-6 top-1 size-4 -translate-x-1/2 rounded-full border-2 border-border bg-background",
                  item.completed && "border-primary"
                )}
              />
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 data-slot="timeline-title" className="text-sm font-medium">
                    {item.title}
                  </h3>
                  {item.badges}
                </div>
                {item.meta ? (
                  <div className="text-xs text-muted-foreground">{item.meta}</div>
                ) : null}
              </div>
            </div>

            {item.content ? (
              <div
                data-slot="timeline-content"
                className="rounded-lg border bg-card p-4 text-sm text-muted-foreground"
              >
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
