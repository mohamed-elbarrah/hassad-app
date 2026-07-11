"use client";

import {
  TimelineComponent,
  TimelineItem,
} from "@/components/dashboard/finance/TimelineComponent";

interface HistoryEntry {
  id: string;
  action: string;
  createdAt: string | Date;
  userId?: string | null;
  user?: { id: string; name: string } | null;
}

interface InvoiceTimelineProps {
  history: HistoryEntry[];
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_INVOICE: "إنشاء الفاتورة",
  SEND_INVOICE: "إرسال الفاتورة",
  REGISTER_PAYMENT: "تسجيل دفعة",
  UPDATE_INVOICE: "تحديث الفاتورة",
  SEND_REMINDER: "إرسال تذكير",
  AUTO_GENERATE_INVOICE: "إنشاء تلقائي",
  GENERATE_SCHEDULED_INVOICE: "إنشاء مجدول",
};

const ACTION_STATUS: Record<
  string,
  "success" | "pending" | "error" | "default"
> = {
  CREATE_INVOICE: "default",
  SEND_INVOICE: "pending",
  REGISTER_PAYMENT: "success",
  UPDATE_INVOICE: "pending",
  SEND_REMINDER: "pending",
  AUTO_GENERATE_INVOICE: "default",
  GENERATE_SCHEDULED_INVOICE: "default",
};

export function InvoiceTimeline({ history }: InvoiceTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-4 text-portal-note-text text-sm">
        لا يوجد سجل أحداث
      </div>
    );
  }

  const timeline: TimelineItem[] = history.map((log) => ({
    id: log.id,
    event: ACTION_LABELS[log.action] || log.action,
    date: new Date(log.createdAt).toLocaleString("ar-SA-u-nu-latn"),
    user: log.user?.name || log.userId || "النظام",
    status: ACTION_STATUS[log.action] || "default",
  }));

  return <TimelineComponent items={timeline} />;
}
