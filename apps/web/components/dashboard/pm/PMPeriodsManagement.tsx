"use client";

import { useState, useRef } from "react";
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
  Sparkles,
} from "lucide-react";
import { ContractType } from "@hassad/shared";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
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
  useLazyDownloadPeriodReportQuery,
  useGeneratePeriodsMutation,
  type ProjectPeriod,
  type PeriodGoal,
} from "@/features/projects/periodsApi";
import { PMGoalEditor, GoalList } from "./PMGoalEditor";
import { PMPeriodMeetings } from "./PMPeriodMeetings";

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

interface PeriodCardProps {
  period: ProjectPeriod;
  isExpanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}

function PeriodCard({
  period,
  isExpanded,
  onToggle,
  onRefresh,
}: PeriodCardProps) {
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
  const [saveSummary, { isLoading: isSavingSummary }] =
    useSavePeriodSummaryMutation();
  const [setCompletionPct, { isLoading: isSettingCompletion }] =
    useSetPeriodCompletionMutation();
  const [saveGoals, { isLoading: isSavingGoals }] = useSavePeriodGoalsMutation();
  const [uploadReport, { isLoading: isUploadingReport }] =
    useUploadPeriodReportMutation();
  const [triggerReportDownload, { isFetching: isDownloadingReport }] =
    useLazyDownloadPeriodReportQuery();

  const reportInputRef = useRef<HTMLInputElement>(null);
  const isClosed = period.status === "CLOSED";
  const isSuspended = period.status === "SUSPENDED";
  const canEdit = !isClosed && !isSuspended;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenPeriod = async () => {
    try {
      await openPeriod(period.id).unwrap();
      onRefresh();
    } catch (e) {
      console.error("Failed to open period:", e);
    }
  };

  const handleClosePeriod = async () => {
    try {
      await closePeriod({ periodId: period.id }).unwrap();
      setShowCloseModal(false);
      onRefresh();
    } catch (e) {
      console.error("Failed to close period:", e);
    }
  };

  const handleExtendPeriod = async () => {
    if (!extendDate) return;
    try {
      await extendPeriod({ periodId: period.id, endDate: extendDate }).unwrap();
      setShowExtendModal(false);
      onRefresh();
    } catch (e) {
      console.error("Failed to extend period:", e);
    }
  };

  const handleSaveSummary = async () => {
    try {
      await saveSummary({ periodId: period.id, summary }).unwrap();
      onRefresh();
    } catch (e) {
      console.error("Failed to save summary:", e);
    }
  };

  const handleSaveGoals = async () => {
    try {
      await saveGoals({ periodId: period.id, goals: editingGoals }).unwrap();
      setShowGoalsEditor(false);
      onRefresh();
    } catch (e) {
      console.error("Failed to save goals:", e);
    }
  };

  const handleCompletionChange = async (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setCompletion(clamped);
    try {
      await setCompletionPct({
        periodId: period.id,
        completionPercentage: clamped,
      }).unwrap();
    } catch (e) {
      console.error("Failed to update completion:", e);
    }
  };

  const handleUploadReport = async (file: File) => {
    try {
      await uploadReport({ periodId: period.id, file }).unwrap();
      onRefresh();
    } catch (e) {
      console.error("Failed to upload report:", e);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const res = await triggerReportDownload(period.id);
      if (res.data?.url) window.open(res.data.url, "_blank");
    } catch (e) {
      console.error("Failed to download report:", e);
    }
  };

  const goals = period.goals ?? [];

  return (
    <>
      <div className="relative pr-0 md:pr-12">
        {/* Timeline dot */}
        <div className="hidden md:absolute right-2.5 top-6 z-10 md:flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600">
          <PeriodIcon status={period.status} />
        </div>

        <div
          className={cn(
            "cursor-pointer transition-all rounded-2xl border-[1.5px] bg-white dark:bg-gray-900 hover:shadow-md",
            isSuspended && "border-amber-300 dark:border-amber-700",
            period.status === "ACTIVE" && "border-emerald-300 dark:border-emerald-700",
            isClosed && "border-blue-300 dark:border-blue-700",
            period.status === "UPCOMING" && "border-gray-200 dark:border-gray-700",
          )}
        >
          {/* Header */}
          <div className="p-4" onClick={onToggle}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  الفترة {period.periodNumber}
                </span>
                <StatusBadge
                  status={period.status}
                  label={PERIOD_STATUS_LABEL[period.status]}
                />
                {period.status === "ACTIVE" && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600 dark:bg-emerald-900/20">
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
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-0">
              {/* Suspended alert */}
              {isSuspended && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>هذه الفترة معلقة بسبب عدم سداد الفاتورة.</span>
                </div>
              )}

              {/* PM lifecycle actions */}
              {canEdit && (
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

              {/* Goals */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      أهداف الفترة
                    </span>
                  </div>
                  {canEdit && (
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
                  <PMGoalEditor
                    goals={editingGoals}
                    onChange={setEditingGoals}
                    onSave={handleSaveGoals}
                    isSaving={isSavingGoals}
                  />
                ) : (
                  <GoalList goals={goals} />
                )}
              </div>

              {/* Completion */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    نسبة الإنجاز
                  </span>
                  <span className="text-sm font-bold">{completion}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        completion >= 100 ? "bg-emerald-500" : "bg-blue-500",
                      )}
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  {canEdit && (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={completion}
                      onChange={(e) => handleCompletionChange(Number(e.target.value))}
                      disabled={isSettingCompletion}
                      className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-center text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ملخص الفترة
                  </span>
                  {canEdit && (
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
                  readOnly={isClosed}
                  placeholder="أضف ملخصاً لهذه الفترة..."
                  rows={3}
                  className={cn(
                    "w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800/50",
                    isClosed && "cursor-not-allowed opacity-70",
                  )}
                />
              </div>

              {/* Report file (PM uploads at end of period) */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <FileText className="size-4 text-gray-500" />
                    تقرير الفترة
                  </div>
                  <div className="flex items-center gap-2">
                    {period.reportFilePath && (
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadReport}
                        loading={isDownloadingReport}
                        icon={<Download className="size-4" />}
                      >
                        تحميل
                      </ActionButton>
                    )}
                    {canEdit && (
                      <ActionButton
                        variant="outline"
                        size="sm"
                        onClick={() => reportInputRef.current?.click()}
                        loading={isUploadingReport}
                        icon={<Upload className="size-4" />}
                      >
                        {period.reportFilePath ? "استبدال" : "رفع التقرير"}
                      </ActionButton>
                    )}
                  </div>
                </div>
                <input
                  ref={reportInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadReport(file);
                    if (reportInputRef.current) reportInputRef.current.value = "";
                  }}
                />
                {!period.reportFilePath && (
                  <p className="rounded-xl bg-gray-50 py-3 text-center text-sm text-gray-400 dark:bg-gray-800/50">
                    لم يتم رفع تقرير لهذه الفترة بعد
                  </p>
                )}
              </div>

              {/* Meetings */}
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                <PMPeriodMeetings
                  periodId={period.id}
                  meetings={period.meetings ?? []}
                  canEdit={canEdit}
                />
              </div>

              {/* Invoice info */}
              {period.invoice && (
                <div className="mt-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="size-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">الفاتورة:</span>
                    <span className="font-medium">{period.invoice.invoiceNumber}</span>
                    <span className="font-bold mx-1">
                      {period.invoice.amount.toLocaleString()} ر.س
                    </span>
                    <StatusBadge status={period.invoice.status} label={period.invoice.status} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Close Period Dialog */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-semibold">إغلاق الفترة</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              هل أنت متأكد من إغلاق هذه الفترة؟ سيتم إصدار فاتورة الفترة تلقائياً.
            </p>
            <p className="mb-6 text-sm text-gray-500">
              سيتم تحويل الفترة إلى حالة &quot;مغلقة&quot; وفتح الفترة التالية تلقائياً إذا كان تاريخ
              البدء قد حان.
            </p>
            <div className="flex justify-end gap-2">
              <ActionButton variant="outline" onClick={() => setShowCloseModal(false)}>
                إلغاء
              </ActionButton>
              <ActionButton onClick={handleClosePeriod} loading={isClosing}>
                إغلاق الفترة
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Extend Period Dialog */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-semibold">تمديد الفترة</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              حدد التاريخ الجديد لانتهاء الفترة.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                تاريخ الانتهاء الجديد
              </label>
              <input
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
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
  /** Contract type — controls whether periods can be generated. */
  contractType?: string;
}

export function PMPeriodsManagement({ projectId, contractType }: PMPeriodsManagementProps) {
  const { data: periods, isLoading, refetch } = useGetProjectPeriodsQuery(projectId);
  const [createExtraPeriod, { isLoading: isCreating }] = useCreateExtraPeriodMutation();
  const [generatePeriods, { isLoading: isGenerating }] = useGeneratePeriodsMutation();
  const [expanded, setExpanded] = useState<string | null>(null);

  const isRetainer = contractType === ContractType.MONTHLY_RETAINER;

  const handleCreateExtra = async () => {
    try {
      await createExtraPeriod(projectId).unwrap();
      refetch();
    } catch (e) {
      console.error("Failed to create extra period:", e);
    }
  };

  const handleGenerate = async () => {
    try {
      await generatePeriods(projectId).unwrap();
      refetch();
    } catch (e) {
      console.error("Failed to generate periods:", e);
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
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
            <Calendar className="size-7" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">لا توجد فترات بعد</p>
            <p className="mt-1 text-sm text-gray-400">
              {isRetainer
                ? "يمكنك توليد الفترات الشهرية لهذا المشروع الآن، أو سيتم توليدها تلقائياً عند تفعيل العقد."
                : "المشاريع ذات العقود الثابتة لا تستخدم الفترات الشهرية."}
            </p>
          </div>
          {isRetainer && (
            <ActionButton
              onClick={handleGenerate}
              loading={isGenerating}
              icon={<Sparkles className="size-4" />}
            >
              توليد الفترات الشهرية
            </ActionButton>
          )}
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          الفترات الشهرية ({periods.length})
        </h3>
        <ActionButton
          variant="outline"
          size="sm"
          onClick={handleCreateExtra}
          loading={isCreating}
        >
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