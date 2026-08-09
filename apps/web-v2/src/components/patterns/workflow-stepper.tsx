import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkflowStep = {
  key: string;
  label: string;
  state: "completed" | "current" | "upcoming";
  value?: string;
};

type WorkflowStepperProps = {
  steps: WorkflowStep[];
};

export function WorkflowStepper({ steps }: WorkflowStepperProps) {
  return (
    <div className="w-full">
      <div className="hidden items-center gap-0 sm:flex">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    step.state === "completed" &&
                      "border-primary bg-primary text-primary-foreground",
                    step.state === "current" &&
                      "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20",
                    step.state === "upcoming" &&
                      "border-border bg-background text-muted-foreground",
                  )}
                >
                  {step.state === "completed" ? (
                    <CheckIcon className="size-5" />
                  ) : step.value ? (
                    <span className="text-sm font-bold">{step.value}</span>
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-medium",
                    step.state === "upcoming" ? "text-muted-foreground" : "text-primary",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast ? (
                <div className="relative mx-2 h-0.5 flex-1">
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full",
                      step.state === "upcoming" ? "bg-border" : "bg-primary/40",
                    )}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                step.state === "completed" &&
                  "border-primary bg-primary text-primary-foreground",
                step.state === "current" &&
                  "border-primary bg-primary text-primary-foreground",
                step.state === "upcoming" &&
                  "border-border bg-background text-muted-foreground",
              )}
            >
              {step.state === "completed" ? (
                <CheckIcon className="size-4" />
              ) : step.value ? (
                <span className="text-xs font-bold">{step.value}</span>
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                step.state === "upcoming" ? "text-muted-foreground" : "text-primary",
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
