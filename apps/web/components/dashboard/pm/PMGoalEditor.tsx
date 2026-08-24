"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import { useId, useState } from "react";
import { Plus, Save, X, Check, Loader2, Pencil, Trash2 } from "lucide-react";
import type { PeriodGoal, PeriodGoalStatus } from "@hassad/shared";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: PeriodGoalStatus; label: string }[] = [
  { value: "pending", label: "معلق" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "done", label: "مكتمل" },
];

const STATUS_DOT: Record<PeriodGoalStatus, string> = {
  pending: "bg-muted-foreground",
  in_progress: "bg-primary",
  done: "bg-secondary-foreground",
};

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
  const id = useId();
  const handleStatusChange = (status: PeriodGoalStatus) =>
    onChange({
      ...goal,
      status,
      progress: defaultProgressFor(status, goal.progress),
    });

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Label htmlFor={`${id}-title`}>عنوان الهدف</Label>
          <Input
            id={`${id}-title`}
            placeholder="عنوان الهدف"
            value={goal.title}
            onChange={(e) => onChange({ ...goal, title: e.target.value })}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          aria-label="حذف الهدف"
        >
          <X data-icon="inline-start" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-description`}>وصف الهدف (اختياري)</Label>
        <Input
          id={`${id}-description`}
          placeholder="وصف (اختياري)"
          value={goal.description ?? ""}
          onChange={(e) =>
            onChange({ ...goal, description: e.target.value || undefined })
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor={`${id}-status`}>حالة الهدف</Label>
        <Select value={goal.status} onValueChange={handleStatusChange}>
          <SelectTrigger id={`${id}-status`} className="w-40">
            <SelectValue placeholder="حالة الهدف" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="flex min-w-48 flex-1 items-center gap-3">
          <Label htmlFor={`${id}-progress`}>نسبة الإنجاز</Label>
          <Slider
            id={`${id}-progress`}
            min={0}
            max={100}
            step={5}
            value={[goal.progress]}
            onValueChange={([progress]) => {
              const status: PeriodGoalStatus =
                progress >= 100
                  ? "done"
                  : progress > 0
                    ? "in_progress"
                    : "pending";
              onChange({ ...goal, progress, status });
            }}
            aria-label="نسبة إنجاز الهدف"
          />
          <span className="w-10 text-xs font-medium text-muted-foreground">
            {goal.progress}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
    <div className="flex flex-col gap-3" dir="rtl">
      <div className="flex flex-col gap-2">
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
        <Label htmlFor="new-goal-title" className="sr-only">
          عنوان الهدف الجديد
        </Label>
        <Input
          id="new-goal-title"
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
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addGoal}
          disabled={!newTitle.trim()}
          aria-label="إضافة هدف"
        >
          <Plus data-icon="inline-start" />
        </Button>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          حفظ الأهداف
        </Button>
      </div>
    </div>
  );
}

/** Read-only goal list (used when not editing). */
export function GoalList({
  goals,
  onEdit,
  onDelete,
}: {
  goals: PeriodGoal[];
  onEdit?: () => void;
  onDelete?: (index: number) => void;
}) {
  if (!goals || goals.length === 0) {
    return (
      <div className="rounded-xl bg-muted py-3 text-center text-sm text-muted-foreground">
        لم يتم تحديد أهداف لهذه الفترة
      </div>
    );
  }
  const completed = goals.filter((g) => g.status === "done").length;
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-muted p-3">
      <div className="mb-2 text-xs text-muted-foreground">
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
                  ? "text-muted-foreground line-through"
                  : "text-foreground",
              )}
            >
              {goal.title}
            </p>
            {goal.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {goal.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {goal.status === "done" && <Check className="text-primary" />}
            {onEdit && (
              <Button type="button" variant="ghost" size="icon" onClick={onEdit} aria-label={`تعديل الهدف ${goal.title}`}>
                <Pencil />
              </Button>
            )}
            {onDelete && (
              <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(idx)} aria-label={`حذف الهدف ${goal.title}`}>
                <Trash2 />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
