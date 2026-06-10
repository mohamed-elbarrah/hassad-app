"use client";

import { TimelineItem as DSTimelineItem } from "@/components/design-system/Timeline";
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

export function TimelineComponent({
  items,
  className,
}: TimelineComponentProps) {
  return (
    <div className={className}>
      {items.map((item, index) => {
        const Icon =
          item.status === "success"
            ? CheckCircle2
            : item.status === "error"
              ? AlertCircle
              : item.status === "pending"
                ? Clock
                : Circle;

        const variant =
          item.status === "success"
            ? "success"
            : item.status === "error"
              ? "danger"
              : item.status === "pending"
                ? "warning"
                : "default";

        const description = [
          item.user && `بواسطة: ${item.user}`,
          item.description,
          item.amount && `المبلغ: ${item.amount.toLocaleString()} ر.س`,
        ]
          .filter(Boolean)
          .join(" — ");

        return (
          <DSTimelineItem
            key={item.id}
            title={item.event}
            timestamp={item.date}
            description={description || undefined}
            icon={<Icon className="w-4 h-4 text-white" />}
            variant={variant}
            isLast={index === items.length - 1}
          />
        );
      })}
    </div>
  );
}
