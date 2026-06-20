"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  PauseCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Target,
  Edit3,
  Save,
  Upload,
  FileText,
  Download,
  AlertCircle,
  Play,
  Square,
  X,
  Check,
} from "lucide-react";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { cn } from "@/lib/utils";
import {
  useGetProjectPeriodsQuery,
  useClosePeriodMutation,
  useOpenPeriodMutation,
  useExtendPeriodMutation,
  useCreateExtraPeriodMutation,
  useSavePeriodSummaryMutation,
  useSetPeriodCompletionMutation,
  useSavePeriodGoalsMutation,
  useUploadPeriodReportMutation,
  type ProjectPeriod,
  type PeriodGoal,
} from "@/features/projects/periodsApi";

const PERIOD_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "نشطة",
  CLOSED: "مغلقة",
  UPCOMING: "قادمة",
  SUSPENDED: "معلقة",
};

function PeriodIcon({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <Play className="size-5 text-emerald-500" />;
    case "CLOSED":
      return <CheckCircle2 className="size-5 text-blue-500" />;
    case "SUSPENDED":
      return <PauseCircle className="size-5 text-amber-500" />;
    default:
      return <Clock className="size-5 text-gray-400" />;
  }
}

interface GoalEditorProps {
  goals: PeriodGoal[];
  onChange: (goals: PeriodGoal[]) => void;
  onSave: () => void;
  isSaving: boolean;
}

function GoalEditor({ goals, onChange, onSave, isSaving }: GoalEditorProps) {
  const [newGoal, setNewGoal] = useState({ title: "", description: "" });

  const addGoal = () => {
    if (!newGoal.title.trim()) return;
    onChange([...goals, { ...newGoal, completed: false }]);
    setNewGoal({ title: "", description: "" });
  };

  const toggleGoal = (index: number) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], completed: !updated[index].completed };
    onChange(updated);
  };

  const removeGoal = (index: number) => {
    onChange(goals.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Existing goals */}
      <div className="space-y-2">
        {goals.map((goal, index) => (
          <div key={index} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            <button
              onClick={() => toggleGoal(index)}
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                goal.completed
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
              )}
            >
              {goal.completed && <Check className="size-3 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", goal.completed && "line-through text-gray-500")}>
                {goal.title}
              </p>
              {goal.description && (
                <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
              )}
            </div>
            <button
              onClick={() => removeGoal(index)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new goal */}
      <div className="flex gap-2">
        <FormInputControl
          placeholder="عنوان الهدف"
          value={newGoal.title}
          onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
          className="flex-1"
        />
        <FormInputControl
          placeholder="وصف (اختياري)"
          value={newGoal.description}
          onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
          className="flex-1"
        />
        <ActionButton variant="outline" size="sm" onClick={addGoal} disabled={!newGoal.title.trim()}>
          <Plus className="size-4" />
        </ActionButton>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <ActionButton size="sm" onClick={onSave} loading={isSaving} disabled={isSaving}>
          <Save className="size-4 mr-1" />
          حفظ الأهداف
        </ActionButton>
      </div>
    </div>
  );
}

interface PeriodCardProps {
  period: ProjectPeriod;
  projectId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}

function PeriodCard({ period, projectId, isExpanded, onToggle, onRefresh }: PeriodCardProps) {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showGoalsEditor, setShowGoalsEditor] = useState(false);
  const [editingGoals, setEditingGoals] = useState<PeriodGoal[]>([]);
  const [summary, setSummary] = useState(period.summary || "");
  const [completion, setCompletion] = useState(period.completionPercentage);
  const [extendDate, setExtendDate] = useState("");

  const [closePeriod, { isLoading: isClosing }] = useClosePeriodMutation();
  const [openPeriod, { isLoading: isOpening }] = useOpenPeriodMutation();
  const [extendPeriod, { isLoading: isExtending }] = useExtendPeriodMutation();
  const [saveSummary, { isLoading: isSavingSummary }] = useSavePeriodSummaryMutation();
  const [setCompletionPct, { isLoading: isSettingCompletion }] = useSetPeriodCompletionMutation();
  const [saveGoals, { isLoading: isSavingGoals }] = useSavePeriodGoalsMutation();

  const handleOpenPeriod = async () => {
    try {
      await openPeriod(period.id).unwrap();
      onRefresh();
    } catch (error) {
      console.error("Failed to open period:", error);
    }
  };

  const handleClosePeriod = async (reason?: string) => {
    try {
      await closePeriod({ periodId: period.id, reason }).unwrap();
      setShowCloseModal(false);
      onRefresh();
    } catch (error) {
      console.error("Failed to close period:", error);
    }
  };

  const handleExtendPeriod = async () => {
    if (!extendDate) return;
    try {
      await extendPeriod({ periodId: period.id, endDate: extendDate }).unwrap();
      setShowExtendModal(false);
      onRefresh();
    } catch (error) {
      console.error("Failed to extend period:", error);
    }
  };

  const handleSaveSummary = async () => {
    try {
      await saveSummary({ periodId: period.id, summary }).unwrap();
      onRefresh();
    } catch (error) {
      console.error("Failed to save summary:", error);
    }
  };

  const handleSaveGoals = async () => {
    try {
      await saveGoals({ periodId: period.id, goals: editingGoals }).unwrap();
      setShowGoalsEditor(false);
      onRefresh();
    } catch (error) {
      console.error("Failed to save goals:", error);
    }
  };

  const handleCompletionChange = async (value: number) => {
    try {
      await setCompletionPct({ periodId: period.id, completionPercentage: value }).unwrap();
      setCompletion(value);
    } catch (error) {
      console.error("Failed to update completion:", error);
    }
  };

  const goals = period.goals || [];
  const completedGoals = goals.filter((g) => g.completed).length;

  return (
    <>
      <div className="relative pr-0 md:pr-12">
        {/* Timeline dot */}
        <div className="hidden md:absolute right-2.5 top-6 z-10 md:flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600">
          <PeriodIcon status={period.status} />
        </div>

        <div
          className={cn(
            "cursor-pointer transition-all rounded-2xl border-[1.5px] bg-white dark:bg-gray-900",
            period.status === "SUSPENDED" && "border-amber-300 dark:border-amber-700",
            period.status === "ACTIVE" && "border-emerald-300 dark:border-emerald-700",
            period.status === "CLOSED" && "border-blue-300 dark:border-blue-700",
            period.status === "UPCOMING" && "border-gray-200 dark:border-gray-700",
            "hover:shadow-md"
          )}
        >
          {/* Header */}
          <div className="p-4" onClick={onToggle}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  الفترة {period.periodNumber}
                </span>
                <StatusBadge status={period.status} label={PERIOD_STATUS_LABEL[period.status]} />
                {period.status === "ACTIVE" && (
                  <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    الحالية
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{new Date(period.startDate).toLocaleDateString("ar-SA")}</span>
                <span>→</span>
                <span>{new Date(period.endDate).toLocaleDateString("ar-SA")}</span>
                <div className="mr-2">
                  {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </div>
              </div>
            </div>
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700 space-y-4">
              {/* Suspended alert */}
              {period.status === "SUSPENDED" && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>هذه الفترة معلقة بسبب عدم سداد الفاتورة.</span>
                </div>
              )}

              {/* PM Actions */}
              {period.status !== "CLOSED" && period.status !== "SUSPENDED" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {period.status === "UPCOMING" && (
                    <ActionButton
                      variant="outline"
                      size="sm"
                      onClick={handleOpenPeriod}
                      loading={isOpening}
                      icon={<Play className="size-4" />}
                    >
                      فتح الآن
                    </ActionButton>
                  )}
                  {period.status === "ACTIVE" && (
                    <>
                      <ActionButton
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCloseModal(true)}
                        icon={<Square className="size-4" />}
                      >
                        إغلاق الفترة
                      </ActionButton>
                      <ActionButton
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExtendModal(true)}
                        icon={<Calendar className="size-4" />}
                      >
                        تمديد
                      </ActionButton>
                    </>
                  )}
                </div>
              )}

              {/* Goals section */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      أهداف الفترة
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {completedGoals}/{goals.length} مكتمل
                    </span>
                  </div>
                  {period.status !== "CLOSED" && (
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingGoals(goals);
                        setShowGoalsEditor(true);
                      }}
                      icon={<Edit3 className="size-4" />}
                    >
                      تعديل
                    </ActionButton>
                  )}
                </div>

                {showGoalsEditor ? (
                  <GoalEditor
                    goals={editingGoals}
                    onChange={setEditingGoals}
                    onSave={handleSaveGoals}
                    isSaving={isSavingGoals}
                  />
                ) : goals.length > 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-1">
                    {goals.map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-2 py-1">
                        <div
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                            goal.completed
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                          )}
                        >
                          {goal.completed && <Check className="size-2.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm",
                              goal.completed ? "text-gray-500 line-through" : "text-gray-800 dark:text-gray-200"
                            )}
                          >
                            {goal.title}
                          </p>
                          {goal.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 text-center py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    لم يتم تحديد أهداف لهذه الفترة
                  </div>
                )}
              </div>

              {/* Completion percentage */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    نسبة الإنجاز
                  </span>
                  <span className="text-sm font-bold">{completion}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        completion >= 100 ? "bg-emerald-500" : "bg-blue-500"
                      )}
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  {period.status !== "CLOSED" && (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={completion}
                      onChange={(e) => handleCompletionChange(Number(e.target.value))}
                      className="w-16 text-sm text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1"
                    />
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ملخص الفترة
                  </span>
                  {period.status !== "CLOSED" && (
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveSummary}
                      loading={isSavingSummary}
                      icon={<Save className="size-4" />}
                    >
                      حفظ
                    </ActionButton>
                  )}
                </div>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  readOnly={period.status === "CLOSED"}
                  placeholder="أضف ملخصاً لهذه الفترة..."
                  className={cn(
                    "w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500",
                    period.status === "CLOSED" && "cursor-not-allowed opacity-70"
                  )}
                  rows={3}
                />
              </div>

              {/* Invoice info */}
              {period.invoice && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="size-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">الفاتورة:</span>
                    <span className="font-medium">{period.invoice.invoiceNumber}</span>
                    <span className="font-bold mx-1">{period.invoice.amount.toLocaleString()} ر.س</span>
                    <StatusBadge status={period.invoice.status} label={period.invoice.status} />
                  </div>
                </div>
              )}

              {/* Report file */}
              {period.reportFilePath && (
                <div className="mt-3">
                  <a
                    href={period.reportFilePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg"
                  >
                    <Download className="size-4" />
                    تحميل تقرير الفترة
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Close Period Dialog */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">إغلاق الفترة</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              هل أنت متأكد من إغلاق هذه الفترة؟ سيتم إصدار فاتورة الفترة تلقائياً.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              سيتم تحويل الفترة إلى حالة "مغلقة" وفتح الفترة التالية تلقائياً إذا كان تاريخ البدء قد حان.
            </p>
            <div className="flex justify-end gap-2">
              <ActionButton variant="outline" onClick={() => setShowCloseModal(false)}>
                إلغاء
              </ActionButton>
              <ActionButton onClick={() => handleClosePeriod()} loading={isClosing}>
                إغلاق الفترة
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Extend Period Dialog */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">تمديد الفترة</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              حدد التاريخ الجديد لانتهاء الفترة.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تاريخ الانتهاء الجديد
              </label>
              <input
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <ActionButton variant="outline" onClick={() => setShowExtendModal(false)}>
                إلغاء
              </ActionButton>
              <ActionButton onClick={handleExtendPeriod} loading={isExtending} disabled={!extendDate}>
                تمديد
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface PMPeriodsManagementProps {
  projectId: string;
}

export function PMPeriodsManagement({ projectId }: PMPeriodsManagementProps) {
  const { data: periods, isLoading, refetch } = useGetProjectPeriodsQuery(projectId);
  const [createExtraPeriod, { isLoading: isCreating }] = useCreateExtraPeriodMutation();
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleCreateExtra = async () => {
    try {
      await createExtraPeriod(projectId).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to create extra period:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!periods || periods.length === 0) {
    return (
      <SurfaceCard>
        <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
          <Calendar className="size-12" />
          <p className="text-lg font-medium">لا توجد فترات بعد</p>
          <p className="text-sm">سيتم إنشاء الفترات تلقائياً عند تفعيل العقد</p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          الفترات الشهرية ({periods.length})
        </h3>
        <ActionButton variant="outline" size="sm" onClick={handleCreateExtra} loading={isCreating}>
          <Plus className="size-4 mr-1" />
          فترة إضافية
        </ActionButton>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute right-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 hidden md:block" />
        
        <div className="flex flex-col gap-4">
          {periods.map((period) => (
            <PeriodCard
              key={period.id}
              period={period}
              projectId={projectId}
              isExpanded={expanded === period.id}
              onToggle={() => setExpanded(expanded === period.id ? null : period.id)}
              onRefresh={() => refetch()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}