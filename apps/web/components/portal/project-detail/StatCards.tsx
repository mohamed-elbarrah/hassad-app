"use client";

import { Calendar, Clock, FileText, Folder, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PortalPeriodStats } from "@/features/portal/portalApi";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTimeTz } from "@/lib/format";

function StatCard({
  icon: Icon,
  value,
  label,
  subtext,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  subtext?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <Icon className="size-5 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {subtext ? (
            <p className="truncate text-xs text-muted-foreground">{subtext}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCards({ stats }: { stats: PortalPeriodStats }) {
  const meeting = stats.nextMeeting;
  const meetingDate = meeting ? new Date(meeting.scheduledAt).getTime() : 0;
  const day = 1000 * 60 * 60 * 24;
  const remaining = meeting
    ? Math.ceil((meetingDate - Date.now()) / day)
    : null;
  const meetingValue =
    remaining === null
      ? "—"
      : remaining < 0
        ? `منذ ${Math.abs(remaining)} يوم`
        : remaining === 0
          ? "اليوم"
          : `${remaining} يوم`;
  return (
    <div className="grid grid-cols-2 gap-3" dir="rtl">
      <StatCard
        icon={Target}
        value={`${stats.goalsCompleted}/${stats.goalsTotal}`}
        label="الأهداف المكتملة"
      />
      <StatCard
        icon={FileText}
        value={`${stats.reportsCount}`}
        label="تقارير الفترة"
      />
      <StatCard
        icon={Folder}
        value={`${stats.filesCount}`}
        label="الملفات المرفقة"
      />
      <StatCard
        icon={meeting ? Calendar : Clock}
        value={meetingValue}
        label="الاجتماع القادم"
        subtext={meeting ? formatDateTimeTz(meeting.scheduledAt) : undefined}
      />
    </div>
  );
}
