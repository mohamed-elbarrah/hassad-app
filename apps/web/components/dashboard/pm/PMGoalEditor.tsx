"use client";

import { useState } from "react";
import { Plus, Save, X, Check, Loader2 } from "lucide-react";
import type { PeriodGoal, PeriodGoalStatus } from "@hassad/shared";
import { ActionButton } from "@/components/design-system/ActionActionButton";
import { FormInputControl } from "@/components/ui/formInputControl";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: PeriodGoalStatus; label: string }[] = [
  { value: "pending", label: "معلق" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "done", label: "مكتمل" },
];

const STATUS_DOT: Record<PeriodGoalStatus, string> = {
  pending: "bg-portal-note-text",
  in_progress: "bg-secondary-500",
  done: "bg-emerald-500",
};

const selectClass =
  "flex h-10 w-full rounded-xl border border-portal-card-border bg-white px-3 py-2 text-sm text-secondary-500 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 transition-colors text-right";

function defaultProgressFor(
  status: PeriodGoalStatus,
  current?: number,
): number {
  if (status === "done") return 100;
  if (status === "pending") return 0;
  return current && current > 0 ? current : 50;
}

interface GoalRowEditorProps {
  goal: PeriodGoal;
  onChange: (goal: PeriodGoal) => void;
  onRemove: () => void;
}

function GoalRowEditor({ goal, onChange, onRemove }: GoalRowEditorProps) {
  const handleStatusChange = (status: PeriodGoalStatus) =>
    onChange({
      ...goal,
      status,
      progress: defaultProgressFor(status, goal.progress),
    });

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-badge-gray-bg p-3">
      <div className="flex items-start gap-2">
        <FormInputControl
          placeholder="عنوان الهدف"
          value={goal.title}
          onChange={(e) => onChange({ ...goal, title: e.target.value })}
          className="flex-1"
        />
        <button
          onClick={onRemove}
          className="mt-1.5 text-portal-note-text transition-colors hover:text-danger-500"
          aria-label="حذف الهدف"
        >
          <X className="size-4" />
        </button>
      </div>

      <FormInputControl
        placeholder="وصف (اختياري)"
        value={goal.description ?? ""}
        onChange={(e) =>
          onChange({ ...goal, description: e.target.value || undefined })
        }
      />

      <div className="flex items-center gap-2">
        <select
          value={goal.status}
          onChange={(e) =>
            handleStatusChange(e.target.value as PeriodGoalStatus)
          }
          className={cn(selectClass, "w-40")}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex flex-1 items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={goal.progress}
            onChange={(e) => {
              const progress = Number(e.target.value);
              const status: PeriodGoalStatus =
                progress >= 100
                  ? "done"
                  : progress > 0
                    ? "in_progress"
                    : "pending";
              onChange({ ...goal, progress, status });
            }}
            className="flex-1 accent-secondary-500"
          />
          <span className="w-10 text-xs font-medium text-portal-note-text">
            {goal.progress}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-portal-note-text">
        <span className={cn("size-2 rounded-full", STATUS_DOT[goal.status])} />
        الحالة: {STATUS_OPTIONS.find((o) => o.value === goal.status)?.label}
      </div>
    </div>
  );
}

interface PMGoalEditorProps {
  goals: PeriodGoal[];
  onChange: (goals: PeriodGoal[]) => void;
  onSave: () => void;
  isSaving: boolean;
}

/** Inline editor for a period's goals (title / description / status / progress). */
export function PMGoalEditor({
  goals,
  onChange,
  onSave,
  isSaving,
}: PMGoalEditorProps) {
  const [newTitle, setNewTitle] = useState("");

  const addGoal = () => {
    if (!newTitle.trim()) return;
    onChange([
      ...goals,
      { title: newTitle.trim(), progress: 0, status: "pending" },
    ]);
    setNewTitle("");
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="space-y-2">
        {goals.map((goal, index) => (
          <GoalRowEditor
            key={index}
            goal={goal}
            onChange={(updated) =>
              onChange(goals.map((g, i) => (i === index ? updated : g)))
            }
            onRemove={() => onChange(goals.filter((_, i) => i !== index))}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <FormInputControl
          placeholder="إضافة هدف جديد..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addGoal();
            }
          }}
          className="flex-1"
        />
        <ActionButton
          variant="outline"
          size="sm"
          onClick={addGoal}
          disabled={!newTitle.trim()}
        >
          <Plus className="size-4" />
        </ActionButton>
      </div>

      <div className="flex justify-end">
        <ActionButton size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          حفظ الأهداف
        </ActionButton>
      </div>
    </div>
  );
}

/** Read-only goal list (used when not editing). */
export function GoalList({ goals }: { goals: PeriodGoal[] }) {
  if (!goals || goals.length === 0) {
    return (
      <div className="rounded-xl bg-badge-gray-bg py-3 text-center text-sm text-portal-note-text">
        لم يتم تحديد أهداف لهذه الفترة
      </div>
    );
  }
  const completed = goals.filter((g) => g.status === "done").length;
  return (
    <div className="space-y-1 rounded-xl bg-badge-gray-bg p-3">
      <div className="mb-2 text-xs text-portal-note-text">
        {completed}/{goals.length} مكتمل
      </div>
      {goals.map((goal, idx) => (
        <div key={idx} className="flex items-start gap-2 py-1">
          <span
            className={cn(
              "mt-1.5 size-3.5 shrink-0 rounded-full",
              STATUS_DOT[goal.status],
            )}
          />
          <div className="flex-1">
            <p
              className={cn(
                "text-sm",
                goal.status === "done"
                  ? "text-portal-note-text line-through"
                  : "text-natural-100",
              )}
            >
              {goal.title}
            </p>
            {goal.description && (
              <p className="mt-0.5 text-xs text-portal-note-text">
                {goal.description}
              </p>
            )}
          </div>
          {goal.status === "done" && (
            <Check className="mt-1 size-3.5 text-emerald-500" />
          )}
        </div>
      ))}
    </div>
  );
}
