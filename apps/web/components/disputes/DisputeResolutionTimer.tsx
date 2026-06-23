"use client";

import { useEffect, useState, useMemo } from "react";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisputeResolutionTimerProps {
  deadlineAt?: string | null;
  status: string;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
  isOverdue: boolean;
}

function calculateTimeRemaining(deadline: Date): TimeRemaining {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const isOverdue = diff < 0;

  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  return {
    days,
    hours,
    minutes,
    totalMs: diff,
    isOverdue,
  };
}

export function DisputeResolutionTimer({
  deadlineAt,
  status,
  className,
}: DisputeResolutionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  // Only show timer for relevant statuses
  const showTimer = ["APPROVED", "IN_PROGRESS"].includes(status);
  const isEscalated = status === "ESCALATED";

  // Calculate deadline date once
  const deadline = useMemo(() => {
    if (!deadlineAt) return null;
    return new Date(deadlineAt);
  }, [deadlineAt]);

  // Update timer every minute
  useEffect(() => {
    if (!deadline || !showTimer) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining(deadline));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [deadline, showTimer]);

  // Escalated state - show overdue indicator
  if (isEscalated) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-full bg-red-100 px-3 py-1.5 text-red-700",
          className
        )}
        dir="rtl"
      >
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">تم التصعيد</span>
      </div>
    );
  }

  // Not a timer-status
  if (!showTimer || !timeRemaining) {
    return null;
  }

  const { days, hours, isOverdue } = timeRemaining;

  // Determine color based on remaining time
  const getTimerStyle = () => {
    if (isOverdue) {
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
      };
    }
    const totalHoursRemaining = days * 24 + hours;
    if (totalHoursRemaining > 48) {
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-200",
      };
    }
    if (totalHoursRemaining > 24) {
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        border: "border-amber-200",
      };
    }
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-200",
    };
  };

  const style = getTimerStyle();

  const formatTime = () => {
    if (isOverdue) {
      return "متأخر عن الموعد";
    }
    const parts = [];
    if (days > 0) parts.push(`${days} يوم`);
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (parts.length === 0) return "أقل من ساعة";
    return parts.join(" و ") + " متبقية";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5",
        style.bg,
        style.text,
        style.border,
        className
      )}
      dir="rtl"
    >
      {isOverdue ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">{formatTime()}</span>
    </div>
  );
}

// ─── Compact Timer for Card View ──────────────────────────────────────────────

interface CompactTimerProps {
  deadlineAt?: string | null;
  status: string;
}

export function CompactTimer({ deadlineAt, status }: CompactTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const deadline = useMemo(() => (deadlineAt ? new Date(deadlineAt) : null), [deadlineAt]);
  const showTimer = ["APPROVED", "IN_PROGRESS"].includes(status);

  useEffect(() => {
    if (!deadline || !showTimer) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining(deadline));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [deadline, showTimer]);

  if (status === "ESCALATED") {
    return (
      <span className="text-xs font-medium text-red-600" dir="rtl">
        ⚠️ متأخر
      </span>
    );
  }

  if (!showTimer || !timeRemaining) {
    return null;
  }

  const { days, hours, isOverdue } = timeRemaining;
  const totalHours = days * 24 + hours;

  const colorClass = isOverdue
    ? "text-red-600"
    : totalHours <= 24
      ? "text-red-600"
      : totalHours <= 48
        ? "text-amber-600"
        : "text-green-600";

  const formatCompact = () => {
    if (isOverdue) return "متأخر";
    if (days > 0) return `${days}ي ${hours}س`;
    if (hours > 0) return `${hours}س`;
    return "أقل من ساعة";
  };

  return (
    <span className={cn("text-xs font-medium", colorClass)} dir="rtl">
      ⏱️ {formatCompact()}
    </span>
  );
}