"use client";

import { useId, type ReactNode } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/format";

export type ProjectDetailRole = "client" | "pm" | "admin";

export interface ProjectPeriodSummary {
  id: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: string;
  completionPercentage: number;
}

interface ProjectPeriodWorkspaceProps {
  role: ProjectDetailRole;
  overview: ReactNode;
  periods: ProjectPeriodSummary[];
  selectedPeriodId: string;
  onSelectPeriod: (periodId: string) => void;
  children: ReactNode;
  className?: string;
}

function periodStatusLabel(status: string) {
  if (status === "ACTIVE") return "الحالية";
  if (status === "CLOSED") return "مكتملة";
  if (status === "SUSPENDED") return "معلقة";
  return "قادمة";
}

export function ProjectPeriodWorkspace({
  role,
  overview,
  periods,
  selectedPeriodId,
  onSelectPeriod,
  children,
  className,
}: ProjectPeriodWorkspaceProps) {
  const overviewTitleId = useId();
  const periodsTitleId = useId();
  const selectedIndex = periods.findIndex((period) => period.id === selectedPeriodId);
  const selectedPeriod = selectedIndex >= 0 ? periods[selectedIndex] : undefined;
  const previous = selectedIndex > 0 ? periods[selectedIndex - 1] : undefined;
  const next = selectedIndex >= 0 ? periods[selectedIndex + 1] : undefined;

  return (
    <div className={cn("flex flex-col gap-6", className)} data-project-role={role} dir="rtl">
      <Card>
        <CardContent className="grid items-start gap-6 p-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
          <section aria-labelledby={overviewTitleId} className="flex min-w-0 flex-col gap-4">
            <h2 id={overviewTitleId} className="text-base font-semibold">نظرة عامة على المشروع</h2>
            {overview}
          </section>

          <section aria-labelledby={periodsTitleId} className="min-w-0 lg:border-s lg:ps-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-muted-foreground" />
                  <h2 id={periodsTitleId} className="text-base font-semibold">الفترات</h2>
                </div>
                {selectedPeriod ? (
                  <Badge variant="outline">الفترة {selectedPeriod.periodNumber} من {periods.length}</Badge>
                ) : null}
              </div>

              {selectedPeriod ? (
                <>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <Button variant="ghost" size="sm" disabled={!previous} onClick={() => previous && onSelectPeriod(previous.id)} aria-label="الفترة السابقة">
                      <ChevronRight data-icon="inline-start" />
                      السابقة
                    </Button>
                    <span className="font-medium">
                      {formatShortDate(selectedPeriod.startDate)} - {formatShortDate(selectedPeriod.endDate)}
                    </span>
                    <Button variant="ghost" size="sm" disabled={!next} onClick={() => next && onSelectPeriod(next.id)} aria-label="الفترة التالية">
                      التالية
                      <ChevronLeft data-icon="inline-end" />
                    </Button>
                  </div>

                  <ol className="flex items-start justify-between gap-2" aria-label="قائمة الفترات">
                    {periods.map((period) => {
                      const isSelected = period.id === selectedPeriod.id;
                      const isComplete = period.status === "CLOSED";
                      return (
                        <li key={period.id} className="relative min-w-0 flex-1">
                          {period.id !== periods.at(-1)?.id ? (
                            <span
                              className="absolute start-1/2 top-4 h-px w-full bg-border"
                              aria-hidden="true"
                            />
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            className="relative z-10 flex h-auto min-w-0 w-full flex-col gap-2 px-1 py-0"
                            aria-current={isSelected ? "step" : undefined}
                            onClick={() => onSelectPeriod(period.id)}
                          >
                            <span className={cn("flex size-8 items-center justify-center rounded-full border-2", isSelected && "border-primary bg-primary text-primary-foreground", isComplete && !isSelected && "border-muted-foreground") }>
                              {isComplete && !isSelected ? <Check /> : isSelected ? period.periodNumber : <Circle />}
                            </span>
                            <span className="truncate text-xs">الفترة {period.periodNumber}</span>
                            <span className="text-xs text-muted-foreground">{periodStatusLabel(period.status)}</span>
                          </Button>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="flex flex-col gap-3 border-t pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">الفترة {selectedPeriod.periodNumber}</span>
                      <Badge variant="secondary">{selectedPeriod.completionPercentage}%</Badge>
                    </div>
                    <Progress value={selectedPeriod.completionPercentage} aria-label={`نسبة إنجاز الفترة ${selectedPeriod.periodNumber}`} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد فترات لهذا المشروع.</p>
              )}
            </div>
          </section>
        </CardContent>
      </Card>

      {selectedPeriod ? <section aria-label="محتوى الفترة المحددة">{children}</section> : null}
    </div>
  );
}
