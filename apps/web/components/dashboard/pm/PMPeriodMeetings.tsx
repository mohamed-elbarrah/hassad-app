"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Edit3,
  Plus,
  Save,
  Clock,
  Video,
  MapPin,
  Loader2,
} from "lucide-react";
import { MeetingStatus } from "@hassad/shared";
import {
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  type ProjectMeeting,
} from "@/features/projects/periodsApi";
import { pmErrorMessage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const statusLabels: Record<MeetingStatus, string> = {
  SCHEDULED: "مجدول",
  DONE: "مكتمل",
  CANCELLED: "ملغي",
  RESCHEDULED: "مؤجل",
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateTimeParts(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

const isTerminal = (status: MeetingStatus) =>
  status === "DONE" || status === "CANCELLED";

// ── Create form ────────────────────────────────────────────────────────────────

function CreateMeetingForm({
  periodId,
  onDone,
}: {
  periodId: string;
  onDone: () => void;
}) {
  const [createMeeting, { isLoading }] = useCreateMeetingMutation();
  const [form, setForm] = useState({
    title: "",
    scheduledDate: "",
    scheduledTime: "",
    durationMin: 30,
    location: "",
    meetingLink: "",
  });

  const set = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.title.trim() || !form.scheduledDate || !form.scheduledTime) return;
    try {
      await createMeeting({
        periodId,
        body: {
          title: form.title.trim(),
          scheduledAt: new Date(`${form.scheduledDate}T${form.scheduledTime}`).toISOString(),
          durationMin: form.durationMin || undefined,
          location: form.location || undefined,
          meetingLink: form.meetingLink || undefined,
        },
      }).unwrap();
      onDone();
    } catch (e) {
      toast.error(pmErrorMessage(e));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onDone()}>
      <DialogContent dir="rtl" className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>جدولة اجتماع</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="meeting-title">عنوان الاجتماع</Label>
      <Input
        id="meeting-title"
        placeholder="عنوان الاجتماع"
        value={form.title}
        onChange={(e) => set({ title: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="meeting-date"
            className="text-xs text-muted-foreground"
          >
            التاريخ
          </Label>
          <Input
            id="meeting-date"
            type="date"
            value={form.scheduledDate}
            onChange={(e) => set({ scheduledDate: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="meeting-time"
            className="text-xs text-muted-foreground"
          >
            الوقت
          </Label>
          <Input
            id="meeting-time"
            type="time"
            value={form.scheduledTime}
            onChange={(e) => set({ scheduledTime: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="meeting-duration"
            className="text-xs text-muted-foreground"
          >
            المدة (دقيقة)
          </Label>
          <Input
            id="meeting-duration"
            type="number"
            min={1}
            value={form.durationMin}
            onChange={(e) => set({ durationMin: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          aria-label="المكان"
          placeholder="المكان"
          value={form.location}
          onChange={(e) => set({ location: e.target.value })}
        />
        <Input
          aria-label="رابط الاجتماع (اختياري)"
          placeholder="رابط الاجتماع (اختياري)"
          value={form.meetingLink}
          onChange={(e) => set({ meetingLink: e.target.value })}
        />
      </div>
          <DialogFooter>
            <Button variant="outline" onClick={onDone}>إلغاء</Button>
            <Button
              onClick={submit}
              disabled={isLoading || !form.title.trim() || !form.scheduledDate || !form.scheduledTime}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Save />}
              جدولة
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Meeting row ────────────────────────────────────────────────────────────────

function MeetingRow({
  meeting,
  periodId,
  canEdit,
}: {
  meeting: ProjectMeeting;
  periodId: string;
  canEdit: boolean;
}) {
  const [updateMeeting, { isLoading }] = useUpdateMeetingMutation();
  const [editing, setEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(meeting.notes ?? "");

  const [editForm, setEditForm] = useState({
    title: meeting.title,
    ...toDateTimeParts(meeting.scheduledAt),
    durationMin: meeting.durationMin ?? 30,
    location: meeting.location ?? "",
    meetingLink: meeting.meetingLink ?? "",
  });

  const setEdit = (patch: Partial<typeof editForm>) =>
    setEditForm((f) => ({ ...f, ...patch }));

  const saveEdit = async () => {
    try {
      await updateMeeting({
        meetingId: meeting.id,
        periodId,
        body: {
          title: editForm.title.trim(),
          scheduledAt: new Date(`${editForm.date}T${editForm.time}`).toISOString(),
          durationMin: editForm.durationMin || undefined,
          location: editForm.location || undefined,
          meetingLink: editForm.meetingLink || undefined,
        },
      }).unwrap();
      setEditing(false);
    } catch (e) {
      toast.error(pmErrorMessage(e));
    }
  };

  const setStatus = async (status: MeetingStatus) => {
    try {
      await updateMeeting({
        meetingId: meeting.id,
        periodId,
        body: { status },
      }).unwrap();
    } catch (e) {
      toast.error(pmErrorMessage(e));
    }
  };

  const saveNotes = async () => {
    try {
      await updateMeeting({
        meetingId: meeting.id,
        periodId,
        body: { notes },
      }).unwrap();
      setShowNotes(false);
    } catch (e) {
      toast.error(pmErrorMessage(e));
    }
  };

  const cancelled = meeting.status === "CANCELLED";
  const done = meeting.status === "DONE";

  if (editing) {
    return (
      <Dialog open onOpenChange={(open) => !open && setEditing(false)}>
        <DialogContent dir="rtl" className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل الاجتماع</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Label htmlFor={`meeting-title-${meeting.id}`}>عنوان الاجتماع</Label>
        <Input
          id={`meeting-title-${meeting.id}`}
          value={editForm.title}
          onChange={(e) => setEdit({ title: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label
              htmlFor={`meeting-date-${meeting.id}`}
              className="text-xs text-muted-foreground"
            >
              التاريخ
            </Label>
            <Input
              id={`meeting-date-${meeting.id}`}
              type="date"
              value={editForm.date}
              onChange={(e) => setEdit({ date: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label
              htmlFor={`meeting-edit-time-${meeting.id}`}
              className="text-xs text-muted-foreground"
            >
              الوقت
            </Label>
            <Input
              id={`meeting-edit-time-${meeting.id}`}
              type="time"
              value={editForm.time}
              onChange={(e) => setEdit({ time: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label
              htmlFor={`meeting-duration-${meeting.id}`}
              className="text-xs text-muted-foreground"
            >
              المدة (دقيقة)
            </Label>
            <Input
              id={`meeting-duration-${meeting.id}`}
              type="number"
              min={1}
              value={editForm.durationMin}
              onChange={(e) => setEdit({ durationMin: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            aria-label="المكان"
            placeholder="المكان"
            value={editForm.location}
            onChange={(e) => setEdit({ location: e.target.value })}
          />
          <Input
            aria-label="رابط الاجتماع"
            placeholder="رابط الاجتماع"
            value={editForm.meetingLink}
            onChange={(e) => setEdit({ meetingLink: e.target.value })}
          />
        </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(false)}>إلغاء</Button>
              <Button
                onClick={saveEdit}
                disabled={isLoading || !editForm.title.trim() || !editForm.date || !editForm.time}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Save />}
                حفظ
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        cancelled
          ? "border-border bg-muted/50"
          : "border-border bg-background hover:border-primary/50",
      )}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              cancelled
                ? "bg-muted text-muted-foreground"
                : done
                  ? "bg-success/10 text-success"
                  : "bg-primary/10 text-primary",
            )}
          >
            {done ? (
              <CheckCircle2 className="size-5" />
            ) : cancelled ? (
              <XCircle className="size-5" />
            ) : (
              <Calendar className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "text-sm font-medium text-foreground",
                  cancelled && "text-muted-foreground line-through",
                )}
              >
                {meeting.title}
              </p>
              <Badge
                variant={
                  meeting.status === MeetingStatus.CANCELLED
                    ? "destructive"
                    : meeting.status === MeetingStatus.DONE
                      ? "default"
                      : "secondary"
                }
              >
                {statusLabels[meeting.status]}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {formatDateTime(meeting.scheduledAt)}
              {meeting.durationMin ? ` · ${meeting.durationMin} دقيقة` : ""}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {meeting.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {meeting.location}
                </span>
              )}
              {meeting.meetingLink && (
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Video className="size-3" />
                  رابط الاجتماع
                </a>
              )}
            </div>
            {meeting.notes && (
              <p className="mt-2 whitespace-pre-line rounded-lg bg-muted p-2 text-xs leading-5 text-muted-foreground">
                {meeting.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {canEdit && !isTerminal(meeting.status) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Edit3 data-icon="inline-start" />
            تعديل
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNotes(meeting.notes ?? "");
              setShowNotes((v) => !v);
            }}
          >
            تقرير/ملاحظات
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-success hover:text-success/80"
            onClick={() => setStatus(MeetingStatus.DONE)}
            disabled={isLoading}
          >
            <CheckCircle2 data-icon="inline-start" />
            تم
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive/80"
            onClick={() => setStatus(MeetingStatus.CANCELLED)}
            disabled={isLoading}
          >
            <XCircle data-icon="inline-start" />
            إلغاء
          </Button>
        </div>
      )}

      {showNotes && (
        <div className="mt-3 flex flex-col gap-2 rounded-lg bg-muted p-3">
          <Label htmlFor={`meeting-notes-${meeting.id}`}>
            تقرير/ملاحظات الاجتماع
          </Label>
          <Textarea
            id={`meeting-notes-${meeting.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب تقرير أو ملاحظات الاجتماع..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotes(false)}
            >
              إغلاق
            </Button>
            <Button size="sm" onClick={saveNotes} disabled={isLoading}>
              حفظ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

interface PMPeriodMeetingsProps {
  periodId: string;
  meetings: ProjectMeeting[];
  canEdit: boolean;
}

/** PM management of a period's client meetings: schedule, edit, cancel, mark done. */
export function PMPeriodMeetings({
  periodId,
  meetings,
  canEdit,
}: PMPeriodMeetingsProps) {
  const [showForm, setShowForm] = useState(false);

  const sorted = [...(meetings ?? [])].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Calendar className="size-4 text-muted-foreground" />
          اجتماعات الفترة
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {sorted.length}
          </span>
        </div>
        {canEdit && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus data-icon="inline-start" />
            جدولة اجتماع
          </Button>
        )}
      </div>

      {showForm && (
        <CreateMeetingForm
          periodId={periodId}
          onDone={() => setShowForm(false)}
        />
      )}

      {sorted.length === 0 && !showForm ? (
        <div className="rounded-xl bg-muted py-6 text-center text-sm text-muted-foreground">
          لا توجد اجتماعات لهذه الفترة
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((meeting) => (
            <MeetingRow
              key={meeting.id}
              meeting={meeting}
              periodId={periodId}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
