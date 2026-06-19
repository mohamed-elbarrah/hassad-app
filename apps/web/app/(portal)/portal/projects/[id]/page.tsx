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

function PeriodIcon({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE": return <Clock className="size-5 text-emerald-500" />;
    case "CLOSED": return <CheckCircle2 className="size-5 text-blue-500" />;
    case "SUSPENDED": return <PauseCircle className="size-5 text-amber-500" />;
    default: return <Calendar className="size-5 text-gray-400" />;
  }
}

function PeriodCard({ period, isExpanded, onToggle }: { period: any; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="relative pr-0 md:pr-12">
      <div className="hidden md:absolute right-2.5 top-6 -translate-x-1/2 z-10 md:flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600">
        <PeriodIcon status={period.status} />
      </div>

      <div
        className={cn(
          "cursor-pointer transition-all hover:shadow-md rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0 p-5",
          period.status === "SUSPENDED" && "border-amber-300 dark:border-amber-700",
          period.status === "ACTIVE" && "border-emerald-300 dark:border-emerald-700",
        )}
        onClick={onToggle}
      >
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
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400">نسبة الإنجاز</span>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${period.completionPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{period.completionPercentage}%</span>
              </div>
            </div>

            {period.invoice && (
              <div>
                <span className="text-xs text-gray-400">الفاتورة</span>
                <div className="mt-1 flex items-center gap-2">
                  <DollarSign className="size-4 text-gray-400" />
                  <span className="text-sm">{period.invoice.invoiceNumber}</span>
                  <span className="text-sm font-medium">{period.invoice.amount.toLocaleString()} ر.س</span>
                  <StatusBadge status={period.invoice.status} label={INVOICE_STATUS_LABEL[period.invoice.status]} />
                </div>
              </div>
            )}

            {period.summary && (
              <div className="md:col-span-2">
                <span className="text-xs text-gray-400">ملخص الفترة</span>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{period.summary}</p>
              </div>
            )}

            {period.reportFilePath && (
              <div className="md:col-span-2">
                <a
                  href={period.reportFilePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="size-4" />
                  تحميل تقرير الفترة
                </a>
              </div>
            )}

            {period.status === "SUSPENDED" && (
              <div className="md:col-span-2 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                <AlertCircle className="size-4 shrink-0" />
                <span>هذه الفترة معلقة بسبب عدم سداد الفاتورة. يرجى التواصل مع مدير المشروع.</span>
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
        description="جدول زمني لفترات العقد وأعمال كل فترة"
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
