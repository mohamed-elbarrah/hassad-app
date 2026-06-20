"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  FileText,
  Download,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  PauseCircle,
  DollarSign,
  Target,
  Paperclip,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Star,
} from "lucide-react";
import { useGetPortalProjectPeriodsQuery } from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { cn } from "@/lib/utils";

const PERIOD_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "نشطة",
  CLOSED: "مغلقة",
  UPCOMING: "قادمة",
  SUSPENDED: "معلقة",
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  PAID: "مدفوعة",
  DUE: "مستحقة",
  LATE: "متأخرة",
  PENDING: "قيد الانتظار",
  SENT: "مرسلة",
  PARTIAL: "مدفوعة جزئياً",
};

const PLATFORM_LABEL: Record<string, string> = {
  META: "ميتا",
  GOOGLE: "جوجل",
  TIKTOK: "تيك توك",
  SNAPCHAT: "سناب شات",
};

function PeriodIcon({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <Clock className="size-5 text-emerald-500" />;
    case "CLOSED":
      return <CheckCircle2 className="size-5 text-blue-500" />;
    case "SUSPENDED":
      return <PauseCircle className="size-5 text-amber-500" />;
    default:
      return <Calendar className="size-5 text-gray-400" />;
  }
}

function GoalItem({ goal }: { goal: { title: string; description?: string; completed: boolean } }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          goal.completed
            ? "border-emerald-500 bg-emerald-500"
            : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
        )}
      >
        {goal.completed && <CheckCircle2 className="size-3 text-white" />}
      </div>
      <div className="flex-1">
        <p className={cn("text-sm font-medium", goal.completed ? "text-gray-500 line-through" : "text-gray-800 dark:text-gray-200")}>
          {goal.title}
        </p>
        {goal.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{goal.description}</p>
        )}
      </div>
    </div>
  );
}

function PeriodCard({
  period,
  isExpanded,
  onToggle,
}: {
  period: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const goals = period.goals as Array<{ title: string; description?: string; completed: boolean }> | null;
  const completedGoals = goals?.filter((g) => g.completed).length ?? 0;
  const totalGoals = goals?.length ?? 0;
  const files = period.files ?? [];

  return (
    <div className="relative pr-0 md:pr-12">
      {/* Timeline dot */}
      <div className="hidden md:absolute right-2.5 top-6 z-10 md:flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600">
        <PeriodIcon status={period.status} />
      </div>

      <div
        className={cn(
          "cursor-pointer transition-all rounded-[30px] border-[1.5px] bg-natural-0",
          period.status === "SUSPENDED" && "border-amber-300 dark:border-amber-700",
          period.status === "ACTIVE" && "border-emerald-300 dark:border-emerald-700",
          period.status === "CLOSED" && "border-blue-300 dark:border-blue-700",
          period.status === "UPCOMING" && "border-gray-200 dark:border-gray-700",
          "hover:shadow-md"
        )}
      >
        {/* Header - always visible */}
        <div className="p-5" onClick={onToggle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                الفترة {period.periodNumber}
              </span>
              <StatusBadge status={period.status} label={PERIOD_STATUS_LABEL[period.status]} />
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
          <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-gray-700 space-y-5">
            {/* Suspended alert */}
            {period.status === "SUSPENDED" && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                <AlertCircle className="size-4 shrink-0" />
                <span>هذه الفترة معلقة بسبب عدم سداد الفاتورة. يرجى التواصل مع مدير المشروع.</span>
              </div>
            )}

            {/* Goals section */}
            {goals && goals.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="size-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    أهداف الفترة
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {completedGoals}/{totalGoals} مكتمل
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-1">
                  {goals.map((goal, idx) => (
                    <GoalItem key={idx} goal={goal} />
                  ))}
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Completion */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <span className="text-xs text-gray-500">نسبة الإنجاز</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        period.completionPercentage >= 100 ? "bg-emerald-500" : "bg-blue-500"
                      )}
                      style={{ width: `${period.completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{period.completionPercentage}%</span>
                </div>
              </div>

              {/* Files count */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <span className="text-xs text-gray-500">الملفات</span>
                <div className="mt-1 flex items-center gap-2">
                  <Paperclip className="size-4 text-gray-400" />
                  <span className="text-sm font-medium">{files.length} ملفات</span>
                </div>
              </div>

              {/* Invoice */}
              {period.invoice && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 col-span-2">
                  <span className="text-xs text-gray-500">الفاتورة</span>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <DollarSign className="size-4 text-gray-400" />
                    <span className="text-sm">{period.invoice.invoiceNumber}</span>
                    <span className="text-sm font-medium">{period.invoice.amount.toLocaleString()} ر.س</span>
                    <StatusBadge
                      status={period.invoice.status}
                      label={INVOICE_STATUS_LABEL[period.invoice.status] || period.invoice.status}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Files list */}
            {files.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="size-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ملفات الفترة
                  </span>
                </div>
                <div className="space-y-2">
                  {files.slice(0, 5).map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{file.fileName}</span>
                        <span className="text-xs text-gray-400">
                          {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : ""}
                        </span>
                      </div>
                      <a
                        href={file.filePath || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="size-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report file */}
            {period.reportFilePath && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    تقرير الفترة
                  </span>
                </div>
                <a
                  href={period.reportFilePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="size-4" />
                  تحميل تقرير الفترة {period.periodNumber}
                </a>
              </div>
            )}

            {/* Summary */}
            {period.summary && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ملخص الفترة
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  {period.summary}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalProjectPeriodsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { data: periods, isLoading } = useGetPortalProjectPeriodsQuery(projectId);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="الفترات الشهرية"
        description="جدول زمني لفترات العقد وأهداف كل فترة"
        icon={Calendar}
        actions={
          <ActionButton variant="outline" size="sm" onClick={() => router.push("/portal/projects")}>
            <ChevronLeft className="size-4 ml-1" />
            عودة للمشاريع
          </ActionButton>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !periods || periods.length === 0 ? (
        <SurfaceCard>
          <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
            <Calendar className="size-12" />
            <p className="text-lg font-medium">لا توجد فترات بعد</p>
            <p className="text-sm">سيتم إنشاء الفترات بعد تفعيل العقد</p>
          </div>
        </SurfaceCard>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 hidden md:block" />
          <div className="flex flex-col gap-4">
            {periods.map((period) => (
              <PeriodCard
                key={period.id}
                period={period}
                isExpanded={expanded === period.id}
                onToggle={() => setExpanded(expanded === period.id ? null : period.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}