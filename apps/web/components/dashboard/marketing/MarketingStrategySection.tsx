"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useGetTaskStrategyQuery, useUploadStrategyMutation, useSendStrategyToClientMutation, useResubmitStrategyMutation } from "@/features/marketing/marketingApi";
import {
  MarketingStrategyStatus,
  MARKETING_STRATEGY_STATUS_AR,
} from "@hassad/shared";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { IconCircle } from "@/components/design-system/IconCircle";
import type { LucideIcon } from "lucide-react";
import {
  Upload,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Download,
  XCircle,
} from "lucide-react";

interface MarketingStrategySectionProps {
  taskId: string;
  isMarketer: boolean; // true if current user is the assigned marketer
  strategyApproved: boolean; // derived from strategy status
  onStrategyStatusChange?: (approved: boolean) => void;
}

const STATUS_CONFIG: Record<
  string,
  { color: "blue" | "amber" | "green" | "red" | "gray"; icon: LucideIcon }
> = {
  DRAFT: { color: "gray", icon: FileText },
  SENT: { color: "amber", icon: Clock },
  APPROVED: { color: "green", icon: CheckCircle2 },
  REVISION_REQUESTED: { color: "red", icon: AlertCircle },
  REJECTED: { color: "red", icon: XCircle },
};

export function MarketingStrategySection({
  taskId,
  isMarketer,
  strategyApproved,
  onStrategyStatusChange,
}: MarketingStrategySectionProps) {
  const {
    data: strategy,
    isLoading,
    refetch,
  } = useGetTaskStrategyQuery(taskId);
  const [uploadStrategy, { isLoading: isUploading }] =
    useUploadStrategyMutation();
  const [sendToClient, { isLoading: isSending }] =
    useSendStrategyToClientMutation();
  const [resubmitStrategy, { isLoading: isResubmitting }] =
    useResubmitStrategyMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const revisionFileInputRef = useRef<HTMLInputElement>(null);
  void useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("يجب أن يكون الملف بصيغة PDF");
      return;
    }

    try {
      await uploadStrategy({ taskId, file }).unwrap();
      toast.success("تم رفع الدراسة التسويقية بنجاح");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء رفع الملف");
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (revisionFileInputRef.current) revisionFileInputRef.current.value = "";
  };

  const handleSendToClient = async () => {
    if (!strategy) return;
    try {
      await sendToClient(strategy.id).unwrap();
      toast.success("تم إرسال الدراسة التسويقية للعميل");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء الإرسال");
    }
  };

  const handleResubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !strategy) return;

    if (file.type !== "application/pdf") {
      toast.error("يجب أن يكون الملف بصيغة PDF");
      return;
    }

    try {
      await resubmitStrategy({ id: strategy.id, file }).unwrap();
      toast.success("تم إعادة إرسال الدراسة التسويقية بنجاح");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء إعادة الإرسال");
    }
    if (revisionFileInputRef.current) revisionFileInputRef.current.value = "";
  };

  const handleDownload = async () => {
    if (!strategy) return;
    try {
      // Trigger download via API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/v1"}/marketing-strategies/${strategy.id}/download`,
        { credentials: "include" },
      );
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      toast.error("حدث خطأ أثناء تحميل الملف");
    }
  };

  if (isLoading) {
    return (
      <SurfaceCard>
        <div className="p-6 animate-pulse">
          <div className="h-5 bg-muted rounded w-40 mb-4" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </SurfaceCard>
    );
  }

  const status = strategy?.status as MarketingStrategyStatus | undefined;
  const statusConfig = status ? STATUS_CONFIG[status] : undefined;
  const statusLabel = status
    ? (MARKETING_STRATEGY_STATUS_AR[status] ?? status)
    : undefined;

  // No strategy exists yet
  if (!strategy) {
    if (!isMarketer) {
      return null; // Non-marketers don't see the section if no strategy
    }

    return (
      <SurfaceCard>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconCircle icon={FileText} />
            <h3 className="text-lg font-semibold">الدراسة التسويقية</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            يجب رفع دراسة تسويقية والحصول على موافقة العميل قبل إنشاء الحملات
          </p>
          <div className="flex items-center gap-3">
            <ActionButton
              icon={<Upload className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
              loading={isUploading}
              variant="primary"
            >
              رفع الدراسة التسويقية (PDF)
            </ActionButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconCircle icon={statusConfig?.icon ?? FileText} />
            <h3 className="text-lg font-semibold">الدراسة التسويقية</h3>
          </div>
          {statusLabel && (
            <StatusBadge status={status ?? "DRAFT"} label={statusLabel} />
          )}
        </div>

        <div className="space-y-3">
          {/* File info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {strategy.fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                {(strategy.fileSize / 1024).toFixed(1)} KB ·{" "}
                {new Date(strategy.createdAt).toLocaleDateString("ar-SA")}
              </p>
            </div>
            <ActionButton
              icon={<Download className="h-4 w-4" />}
              onClick={handleDownload}
              variant="ghost"
              size="sm"
            >
              تحميل
            </ActionButton>
          </div>

          {/* Revision note from client */}
          {strategy.revisionNote &&
            status === MarketingStrategyStatus.REVISION_REQUESTED && (
              <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">
                  ملاحظات العميل للتعديل:
                </p>
                <p className="text-sm text-red-700">{strategy.revisionNote}</p>
              </div>
            )}

          {/* Status messages */}
          {status === MarketingStrategyStatus.DRAFT && isMarketer && (
            <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                الدراسة في حالة مسودة. أرسلها للعميل للحصول على الموافقة.
              </p>
            </div>
          )}

          {status === MarketingStrategyStatus.SENT && (
            <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                الدراسة مُرسلة للعميل — في انتظار المراجعة والموافقة.
              </p>
            </div>
          )}

          {status === MarketingStrategyStatus.APPROVED && (
            <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ تمت الموافقة على الدراسة التسويقية — يمكن الآن إنشاء الحملات.
              </p>
            </div>
          )}

          {status === MarketingStrategyStatus.REJECTED && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                ❌ تم رفض الدراسة التسويقية من العميل.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {status === MarketingStrategyStatus.DRAFT && isMarketer && (
              <ActionButton
                icon={<Send className="h-4 w-4" />}
                onClick={handleSendToClient}
                loading={isSending}
                variant="primary"
              >
                إرسال للعميل
              </ActionButton>
            )}

            {status === MarketingStrategyStatus.REVISION_REQUESTED &&
              isMarketer && (
                <>
                  <ActionButton
                    icon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => revisionFileInputRef.current?.click()}
                    loading={isResubmitting}
                    variant="primary"
                  >
                    رفع دراسة معدّلة (PDF)
                  </ActionButton>
                  <input
                    ref={revisionFileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleResubmit}
                  />
                </>
              )}

            {!isMarketer && status !== MarketingStrategyStatus.APPROVED && (
              <p className="text-xs text-muted-foreground">
                في انتظار قيام المسوق بالإجراء المطلوب
              </p>
            )}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
