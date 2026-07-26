"use client";


import { DEFAULT_LOCALE } from "@/lib/format";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetClientStrategyQuery,
  useApproveStrategyMutation,
  useRequestStrategyRevisionMutation,
} from "@/features/portal/portalApi";
import {
  MARKETING_STRATEGY_STATUS_AR,
  MarketingStrategyStatus,
} from "@hassad/shared";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { IconCircle } from "@/components/design-system/IconCircle";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
  Download,
  MessageSquare,
} from "lucide-react";

const STATUS_ICON: Record<string, LucideIcon> = {
  DRAFT: FileText,
  SENT: Clock,
  APPROVED: CheckCircle2,
  REVISION_REQUESTED: AlertCircle,
  REJECTED: XCircle,
};

const STATUS_COLOR: Record<
  string,
  "blue" | "amber" | "green" | "red" | "gray"
> = {
  DRAFT: "gray",
  SENT: "amber",
  APPROVED: "green",
  REVISION_REQUESTED: "red",
  REJECTED: "red",
};

export default function MarketingStrategyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: strategy, isLoading } = useGetClientStrategyQuery(id);
  const [approveStrategy, { isLoading: isApproving }] =
    useApproveStrategyMutation();
  const [requestRevision, { isLoading: isRequestingRevision }] =
    useRequestStrategyRevisionMutation();

  const [revisionComment, setRevisionComment] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const handleApprove = async () => {
    try {
      await approveStrategy(id).unwrap();
      toast.success("تمت الموافقة على الدراسة التسويقية بنجاح");
    } catch (err) {
      toast.error(err?.data?.message || "حدث خطأ أثناء الموافقة");
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionComment.trim()) {
      toast.error("يرجى كتابة ملاحظات التعديل");
      return;
    }
    try {
      await requestRevision({ id, comment: revisionComment }).unwrap();
      toast.success("تم إرسال طلب التعديل بنجاح");
      setShowRevisionForm(false);
      setRevisionComment("");
    } catch (err) {
      toast.error(err?.data?.message || "حدث خطأ أثناء إرسال طلب التعديل");
    }
  };

  const handleDownload = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || "/v1"}/portal/marketing-strategies/${id}/download`,
      "_blank",
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">الدراسة التسويقية غير موجودة</p>
      </div>
    );
  }

  const statusLabel =
    MARKETING_STRATEGY_STATUS_AR[
      strategy.status as keyof typeof MARKETING_STRATEGY_STATUS_AR
    ] ?? strategy.status;


  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Back button */}
      <button
        onClick={() => router.push("/portal/marketing-strategies")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للدراسات التسويقية
      </button>

      <SurfaceCard>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconCircle icon={STATUS_ICON[strategy.status] ?? FileText} />
              <div>
                <h1 className="text-xl font-semibold">الدراسة التسويقية</h1>
                <p className="text-sm text-muted-foreground">
                  {strategy.task?.project?.name ?? ""} —{" "}
                  {strategy.task?.title ?? ""}
                </p>
              </div>
            </div>
            <StatusBadge
              status={strategy.status ?? MarketingStrategyStatus.DRAFT}
              label={statusLabel}
            />
          </div>

          {/* File info */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{strategy.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {(strategy.fileSize / 1024).toFixed(1)} KB ·{" "}
                {new Date(strategy.createdAt).toLocaleDateString(
                  DEFAULT_LOCALE,
                )}
              </p>
            </div>
            <ActionButton
              icon={<Download className="h-4 w-4" />}
              onClick={handleDownload}
              variant="outline"
              size="sm"
            >
              تحميل PDF
            </ActionButton>
          </div>

          {/* Status-specific messages and actions */}
          {strategy.status === MarketingStrategyStatus.SENT && (
            <div className="space-y-4">
              <div className="p-4 border border-alert-200 bg-alert-100 rounded-lg">
                <p className="text-sm text-alert-700">
                  📋 الدراسة التسويقية بانتظار مراجعتك وموافقتك.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <ActionButton
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={handleApprove}
                  loading={isApproving}
                  variant="primary"
                >
                  موافقة
                </ActionButton>
                <ActionButton
                  icon={<MessageSquare className="h-4 w-4" />}
                  onClick={() => setShowRevisionForm(true)}
                  variant="outline"
                >
                  طلب تعديل
                </ActionButton>
              </div>

              {showRevisionForm && (
                <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <p className="text-sm font-medium">ملاحظات التعديل:</p>
                  <textarea
                    className="w-full border rounded-lg p-3 text-sm min-h-[100px] resize-none"
                    placeholder="اكتب ملاحظاتك للتعديل المطلوب..."
                    value={revisionComment}
                    onChange={(e) => setRevisionComment(e.target.value)}
                    dir="rtl"
                  />
                  <div className="flex items-center gap-2">
                    <ActionButton
                      onClick={handleRequestRevision}
                      loading={isRequestingRevision}
                      variant="primary"
                      size="sm"
                    >
                      إرسال طلب التعديل
                    </ActionButton>
                    <ActionButton
                      onClick={() => {
                        setShowRevisionForm(false);
                        setRevisionComment("");
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      إلغاء
                    </ActionButton>
                  </div>
                </div>
              )}
            </div>
          )}

          {strategy.status === MarketingStrategyStatus.APPROVED && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ تمت الموافقة على هذه الدراسة التسويقية — يمكن الآن بدء
                الحملات الإعلانية.
              </p>
            </div>
          )}

          {strategy.status === "REVISION_REQUESTED" && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-1">طلب تعديل</p>
              <p className="text-sm text-red-700">
                {strategy.revisionNote || "تم طلب تعديل على الدراسة"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                يتم حالياً معالجة التعديلات وسيتم إعادة إرسال الدراسة المحدثة.
              </p>
            </div>
          )}

          {strategy.status === MarketingStrategyStatus.REJECTED && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                ❌ تم رفض الدراسة التسويقية.
              </p>
            </div>
          )}

          {strategy.status === MarketingStrategyStatus.DRAFT && (
            <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                الدراسة في مرحلة الإعداد ولم يتم إرسالها بعد.
              </p>
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
