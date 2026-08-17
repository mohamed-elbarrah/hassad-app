"use client";

import {
  Calendar,
  CheckCircle2,
  MapPin,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import type { PortalPeriodMeeting } from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTimeTz } from "@/lib/format";
import { safeHttpUrl } from "@/lib/utils";
import { EmptyState } from "./EmptyState";

export function MeetingsTab({ meetings }: { meetings: PortalPeriodMeeting[] }) {
  if (!meetings?.length)
    return (
      <EmptyState
        icon={Users}
        title="لا توجد اجتماعات"
        description="لم يتم جدولة أي اجتماعات لهذه الفترة بعد."
      />
    );
  const sorted = [...meetings].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users />
          اجتماعات الفترة
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sorted.map((meeting, index) => {
          const cancelled = meeting.status === "CANCELLED";
          const done = meeting.status === "DONE";
          const Icon = done ? CheckCircle2 : cancelled ? XCircle : Calendar;
          const link = safeHttpUrl(meeting.meetingLink);
          return (
            <div key={meeting.id} className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Icon className="size-5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{meeting.title}</p>
                    <Badge
                      variant={
                        cancelled
                          ? "destructive"
                          : done
                            ? "default"
                            : "secondary"
                      }
                    >
                      {meeting.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTimeTz(meeting.scheduledAt)}
                    {meeting.durationMin
                      ? ` · ${meeting.durationMin} دقيقة`
                      : ""}
                  </p>
                  {meeting.location ? (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin />
                      {meeting.location}
                    </p>
                  ) : null}
                  {link ? (
                    <Button asChild variant="link" size="sm">
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <Video />
                        رابط الاجتماع
                      </a>
                    </Button>
                  ) : null}
                  {meeting.notes ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                      {meeting.notes}
                    </p>
                  ) : null}
                </div>
              </div>
              {index < sorted.length - 1 ? <Separator /> : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
