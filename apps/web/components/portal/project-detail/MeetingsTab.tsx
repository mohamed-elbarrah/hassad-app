"use client";

import {
  Calendar,
  Users,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { PortalPeriodMeeting } from "@/features/portal/portalApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { EmptyState } from "./EmptyState";
import { formatDateTime } from "./helpers";
import { safeHttpUrl } from "@/lib/utils";

function MeetingRow({ meeting }: { meeting: PortalPeriodMeeting }) {
  const isDone = meeting.status === "DONE";
  const isCancelled = meeting.status === "CANCELLED";
  // Defense in depth: server validates http(s) on write, but legacy rows
  // pre-dating that validation could still contain dangerous protocols.
  // safeHttpUrl filters them out at render time.
  const safeMeetingLink = safeHttpUrl(meeting.meetingLink);

  return (
    <div className="flex items-start gap-4 border-b border-portal-divider py-4 last:border-0">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isCancelled
            ? "bg-danger-100 text-danger-600"
            : isDone
              ? "bg-success-100 text-success-600"
              : "bg-blue-50 text-blue-600"
        }`}
      >
        {isDone ? (
          <CheckCircle2 className="size-5" />
        ) : isCancelled ? (
          <XCircle className="size-5" />
        ) : (
          <Calendar className="size-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-medium text-natural-100 ${
              isCancelled ? "text-neutral-400 line-through" : ""
            }`}
          >
            {meeting.title}
          </p>
          <StatusBadge status={meeting.status} />
        </div>
        <p className="mt-1 text-xs text-portal-note-text">
          {formatDateTime(meeting.scheduledAt)}
          {meeting.durationMin ? ` · ${meeting.durationMin} دقيقة` : ""}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-portal-note-text">
          {meeting.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {meeting.location}
            </span>
          )}
          {safeMeetingLink && (
            <a
              href={safeMeetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-action-blue hover:underline"
            >
              <Video className="size-3" />
              رابط الاجتماع
            </a>
          )}
        </div>
        {meeting.notes && (
          <p className="mt-2 whitespace-pre-line rounded-lg bg-badge-gray-bg p-2 text-xs leading-5 text-portal-note-text max-h-40 overflow-y-auto">
            {meeting.notes}
          </p>
        )}
      </div>
    </div>
  );
}

interface MeetingsTabProps {
  meetings: PortalPeriodMeeting[];
}

/** Meetings tab — PM-scheduled client meetings for the selected period. */
export function MeetingsTab({ meetings }: MeetingsTabProps) {
  if (!meetings || meetings.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="لا توجد اجتماعات"
        description="لم يتم جدولة أي اجتماعات لهذه الفترة بعد."
      />
    );
  }

  const sorted = [...meetings].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <SurfaceCard title="اجتماعات الفترة" icon={Users}>
      <div className="space-y-1" dir="rtl">
        {sorted.map((meeting) => (
          <MeetingRow key={meeting.id} meeting={meeting} />
        ))}
      </div>
    </SurfaceCard>
  );
}
