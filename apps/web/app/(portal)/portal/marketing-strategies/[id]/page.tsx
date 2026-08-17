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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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

const STATUS_CLASSES: Record<
  string,
  { icon: string; badge: string }
> = {
  DRAFT: {
    icon: "bg-neutral-100 text-neutral-600",
    badge: "border-neutral-200 bg-neutral-100 text-neutral-600",
  },
  SENT: {
    icon: "bg-info/10 text-info",
    badge: "border-info/20 bg-info/10 text-info",
  },
  APPROVED: {
    icon: "bg-success-100 text-success-600",
    badge: "border-success-200 bg-success-100 text-success-600",
  },
  REVISION_REQUESTED: {
    icon: "bg-warning-100 text-warning-600",
    badge: "border-warning-200 bg-warning-100 text-warning-600",
  },
  REJECTED: {
    icon: "bg-danger-100 text-danger-600",
    badge: "border-danger-200 bg-danger-100 text-danger-600",
  },
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
      <main dir="rtl" className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    );
  }

  if (!strategy) {
    return (
      <main dir="rtl" className="flex flex-col gap-6 p-6">
        <p className="text-muted-foreground">الدراسة التسويقية غير موجودة</p>
      </main>
    );
  }

  const statusLabel =
    MARKETING_STRATEGY_STATUS_AR[
      strategy.status as keyof typeof MARKETING_STRATEGY_STATUS_AR
    ] ?? strategy.status;

  const statusClass =
    STATUS_CLASSES[strategy.status ?? MarketingStrategyStatus.DRAFT];

  return (
    <main dir="rtl" className="flex flex-col gap-6 p-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/portal/marketing-strategies")}
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للدراسات التسويقية
      </button>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between p-0">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${statusClass?.icon}`}
              >
                {(() => {
                  const Icon = STATUS_ICON[strategy.status] ?? FileText;
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">
                  الدراسة التسويقية
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {strategy.task?.project?.name ?? ""} —{" "}
                  {strategy.task?.title ?? ""}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={statusClass?.badge}>
              {statusLabel}
            </Badge>
          </CardHeader>

          {/* File info */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <FileText className="h-8 w-8 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{strategy.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {(strategy.fileSize / 1024).toFixed(1)} KB ·{" "}
                {new Date(strategy.createdAt).toLocaleDateString(
                  DEFAULT_LOCALE,
                )}
              </p>
            </div>
            <Button
              data-icon="inline-start"
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              تحميل PDF
            </Button>
          </div>

          {/* Status-specific messages and actions */}
          {strategy.status === MarketingStrategyStatus.SENT && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-warning-200 bg-warning-100 p-4">
                <p className="text-sm text-warning-800">
                  📋 الدراسة التسويقية بانتظار مراجعتك وموافقتك.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  data-icon="inline-start"
                  onClick={handleApprove}
                  isLoading={isApproving}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  موافقة
                </Button>
                <Button
                  data-icon="inline-start"
                  onClick={() => setShowRevisionForm(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  طلب تعديل
                </Button>
              </div>

              {showRevisionForm && (
                <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">ملاحظات التعديل:</p>
                  <Textarea
                    className="min-h-[100px] resize-none"
                    placeholder="اكتب ملاحظاتك للتعديل المطلوب..."
                    value={revisionComment}
                    onChange={(e) => setRevisionComment(e.target.value)}
                    dir="rtl"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleRequestRevision}
                      isLoading={isRequestingRevision}
                      size="sm"
                    >
                      إرسال طلب التعديل
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRevisionForm(false);
                        setRevisionComment("");
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {strategy.status === MarketingStrategyStatus.APPROVED && (
            <div className="rounded-lg border border-success-200 bg-success-100 p-4">
              <p className="text-sm text-success-800">
                ✅ تمت الموافقة على هذه الدراسة التسويقية — يمكن الآن بدء
                الحملات الإعلانية.
              </p>
            </div>
          )}

          {strategy.status === "REVISION_REQUESTED" && (
            <div className="rounded-lg border border-danger-200 bg-danger-100 p-4">
              <p className="mb-1 text-sm font-medium text-danger-800">
                طلب تعديل
              </p>
              <p className="text-sm text-danger-700">
                {strategy.revisionNote || "تم طلب تعديل على الدراسة"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                يتم حالياً معالجة التعديلات وسيتم إعادة إرسال الدراسة المحدثة.
              </p>
            </div>
          )}

          {strategy.status === MarketingStrategyStatus.REJECTED && (
            <div className="rounded-lg border border-danger-200 bg-danger-100 p-4">
              <p className="text-sm text-danger-800">
                ❌ تم رفض الدراسة التسويقية.
              </p>
            </div>
          )}

          {strategy.status === MarketingStrategyStatus.DRAFT && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-100 p-4">
              <p className="text-sm text-neutral-700">
                الدراسة في مرحلة الإعداد ولم يتم إرسالها بعد.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
