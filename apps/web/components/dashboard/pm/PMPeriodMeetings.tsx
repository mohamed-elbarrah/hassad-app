"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Edit3,
  Plus,
  Save,
  X,
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
  type CreateMeetingInput,
} from "@/features/projects/periodsApi";
import { ActionButton } from "@/components/design-system/ActionButton";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-xl border border-portal-card-border bg-white px-3 py-2 text-sm text-secondary-500 placeholder:text-portal-note-text focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 transition-colors text-right";

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Convert an ISO string to a `datetime-local` input value (local time). */
function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [form, setForm] = useState<CreateMeetingInput>({
    title: "",
    scheduledAt: "",
    durationMin: 30,
    location: "",
    meetingLink: "",
  });

  const set = (patch: Partial<CreateMeetingInput>) =>
    setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.title.trim() || !form.scheduledAt) return;
    try {
      await createMeeting({
        periodId,
        body: {
          title: form.title.trim(),
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMin: form.durationMin || undefined,
          location: form.location || undefined,
          meetingLink: form.meetingLink || undefined,
        },
      }).unwrap();
      onDone();
    } catch (e) {
      console.error("Failed to create meeting:", e);
    }
  };

  return (
    <div
      className="space-y-3 rounded-xl border border-portal-card-border bg-white p-4"
      dir="rtl"
    >
      <FormInputControl
        placeholder="عنوان الاجتماع"
        value={form.title}
        onChange={(e) => set({ title: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-portal-note-text">
          الموعد
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => set({ scheduledAt: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-portal-note-text">
          المدة (دقيقة)
          <FormInputControl
            type="number"
            min={1}
            value={form.durationMin}
            onChange={(e) => set({ durationMin: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInputControl
          placeholder="المكان"
          value={form.location}
          onChange={(e) => set({ location: e.target.value })}
        />
        <FormInputControl
          placeholder="رابط الاجتماع (اختياري)"
          value={form.meetingLink}
          onChange={(e) => set({ meetingLink: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <ActionButton variant="outline" size="sm" onClick={onDone}>
          إلغاء
        </ActionButton>
        <ActionButton
          size="sm"
          onClick={submit}
          disabled={isLoading || !form.title.trim() || !form.scheduledAt}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          جدولة
        </ActionButton>
      </div>
    </div>
  );
}

// ── Meeting row ────────────────────────────────────────────────────────────────

function MeetingRow({
  meeting,
  periodId,
}: {
  meeting: ProjectMeeting;
  periodId: string;
}) {
  const [updateMeeting, { isLoading }] = useUpdateMeetingMutation();
  const [editing, setEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(meeting.notes ?? "");

  const [editForm, setEditForm] = useState({
    title: meeting.title,
    scheduledAt: toDateTimeLocal(meeting.scheduledAt),
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
          scheduledAt: new Date(editForm.scheduledAt).toISOString(),
          durationMin: editForm.durationMin || undefined,
          location: editForm.location || undefined,
          meetingLink: editForm.meetingLink || undefined,
        },
      }).unwrap();
      setEditing(false);
    } catch (e) {
      console.error("Failed to update meeting:", e);
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
      console.error("Failed to update meeting status:", e);
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
      console.error("Failed to save notes:", e);
    }
  };

  const cancelled = meeting.status === "CANCELLED";
  const done = meeting.status === "DONE";

  if (editing) {
    return (
      <div
        className="space-y-3 rounded-xl border border-secondary-200 bg-secondary-50/30 p-4"
        dir="rtl"
      >
        <FormInputControl
          value={editForm.title}
          onChange={(e) => setEdit({ title: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-portal-note-text">
            الموعد
            <input
              type="datetime-local"
              value={editForm.scheduledAt}
              onChange={(e) => setEdit({ scheduledAt: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-portal-note-text">
            المدة (دقيقة)
            <FormInputControl
              type="number"
              min={1}
              value={editForm.durationMin}
              onChange={(e) => setEdit({ durationMin: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormInputControl
            placeholder="المكان"
            value={editForm.location}
            onChange={(e) => setEdit({ location: e.target.value })}
          />
          <FormInputControl
            placeholder="رابط الاجتماع"
            value={editForm.meetingLink}
            onChange={(e) => setEdit({ meetingLink: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2">
          <ActionButton
            variant="outline"
            size="sm"
            onClick={() => setEditing(false)}
          >
            إلغاء
          </ActionButton>
          <ActionButton size="sm" onClick={saveEdit} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            حفظ
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        cancelled
          ? "border-portal-card-border bg-badge-gray-bg/50"
          : "border-portal-card-border bg-white hover:border-secondary-200",
      )}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              cancelled
                ? "bg-badge-gray-bg text-portal-note-text"
                : done
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-blue-50 text-blue-600",
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
                  "text-sm font-medium text-natural-100",
                  cancelled && "text-portal-note-text line-through",
                )}
              >
                {meeting.title}
              </p>
              <StatusBadge status={meeting.status} />
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-portal-note-text">
              <Clock className="size-3" />
              {formatDateTime(meeting.scheduledAt)}
              {meeting.durationMin ? ` · ${meeting.durationMin} دقيقة` : ""}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-portal-note-text">
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
                  className="flex items-center gap-1 text-action-blue hover:underline"
                >
                  <Video className="size-3" />
                  رابط الاجتماع
                </a>
              )}
            </div>
            {meeting.notes && (
              <p className="mt-2 whitespace-pre-line rounded-lg bg-badge-gray-bg p-2 text-xs leading-5 text-portal-note-text">
                {meeting.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isTerminal(meeting.status) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-portal-divider pt-3">
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            icon={<Edit3 className="size-4" />}
          >
            تعديل
          </ActionButton>
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setNotes(meeting.notes ?? "");
              setShowNotes((v) => !v);
            }}
          >
            تقرير/ملاحظات
          </ActionButton>
          <ActionButton
            variant="ghost"
            size="sm"
            className="text-emerald-600 hover:text-emerald-700"
            onClick={() => setStatus(MeetingStatus.DONE)}
            disabled={isLoading}
            icon={<CheckCircle2 className="size-4" />}
          >
            تم
          </ActionButton>
          <ActionButton
            variant="ghost"
            size="sm"
            className="text-danger-500 hover:text-danger-600"
            onClick={() => setStatus(MeetingStatus.CANCELLED)}
            disabled={isLoading}
            icon={<XCircle className="size-4" />}
          >
            إلغاء
          </ActionButton>
        </div>
      )}

      {showNotes && (
        <div className="mt-3 space-y-2 rounded-lg bg-badge-gray-bg p-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب تقرير أو ملاحظات الاجتماع..."
            rows={3}
            className="w-full resize-none rounded-lg border border-portal-card-border bg-white p-2 text-sm focus:outline-none focus:border-secondary-500"
          />
          <div className="flex justify-end gap-2">
            <ActionButton
              variant="outline"
              size="sm"
              onClick={() => setShowNotes(false)}
            >
              إغلاق
            </ActionButton>
            <ActionButton size="sm" onClick={saveNotes} disabled={isLoading}>
              حفظ
            </ActionButton>
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
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-natural-100">
          <Calendar className="size-4 text-portal-note-text" />
          اجتماعات الفترة
          <span className="rounded-full bg-badge-gray-bg px-2 py-0.5 text-xs text-portal-note-text">
            {sorted.length}
          </span>
        </div>
        {canEdit && !showForm && (
          <ActionButton
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            icon={<Plus className="size-4" />}
          >
            جدولة اجتماع
          </ActionButton>
        )}
      </div>

      {showForm && (
        <CreateMeetingForm
          periodId={periodId}
          onDone={() => setShowForm(false)}
        />
      )}

      {sorted.length === 0 && !showForm ? (
        <div className="rounded-xl bg-badge-gray-bg py-6 text-center text-sm text-portal-note-text">
          لا توجد اجتماعات لهذه الفترة
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((meeting) => (
            <MeetingRow
              key={meeting.id}
              meeting={meeting}
              periodId={periodId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
