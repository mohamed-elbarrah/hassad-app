"use client";

import { cn } from "@/lib/utils";
import { Circle, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export interface TimelineItem {
  id: string;
  event: string;
  date: string;
  description?: string;
  amount?: number;
  user?: string;
  status?: "success" | "pending" | "error" | "default";
}

interface TimelineComponentProps {
  items: TimelineItem[];
  className?: string;
}

export function TimelineComponent({ items, className }: TimelineComponentProps) {
  return (
    <div className={cn("space-y-6 relative before:absolute before:inset-y-0 before:right-3.5 before:w-0.5 before:bg-muted", className)}>
      {items.map((item, index) => {
        const Icon = item.status === "success" ? CheckCircle2 : 
                     item.status === "error" ? AlertCircle :
                     item.status === "pending" ? Clock : Circle;
        
        const iconColor = item.status === "success" ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" :
                          item.status === "error" ? "text-rose-500 bg-rose-50 dark:bg-rose-500/10" :
                          item.status === "pending" ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10" :
                          "text-slate-400 bg-slate-50 dark:bg-slate-500/10";

        return (
          <div key={item.id} className="relative pr-10">
            <div className={cn(
              "absolute right-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background z-10",
              iconColor
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-semibold text-sm">{item.event}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.date}</span>
              </div>
              {item.user && (
                <p className="text-xs text-muted-foreground mt-0.5">بواسطة: {item.user}</p>
              )}
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              )}
              {item.amount && (
                <p className="text-sm font-medium text-primary mt-1">المبلغ: {item.amount.toLocaleString()} ر.س</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
