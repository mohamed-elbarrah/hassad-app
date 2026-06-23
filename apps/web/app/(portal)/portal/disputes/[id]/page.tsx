"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare, History } from "lucide-react";
import { toast } from "sonner";
import {
  useGetClientDisputeDetailQuery,
  useAddDisputeMessageMutation,
  useConfirmDisputeResolutionMutation,
} from "@/features/portal/portalApi";
import { DISPUTE_STATUS_AR, DISPUTE_PRIORITY_AR } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/design-system/Skeleton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DisputeStatusBadge,
  DisputeCategoryIcon,
  DisputeMessageThread,
  DisputeConfirmationDialog,
} from "@/components/disputes";

interface PortalDisputeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PortalDisputeDetailPage({
  params,
}: PortalDisputeDetailPageProps) {
  const { id } = use(params);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const {
    data: dispute,
    isLoading,
    refetch,
  } = useGetClientDisputeDetailQuery(id, {
    pollingInterval: 30_000,
  });

  const [addMessage, { isLoading: isSendingMessage }] = useAddDisputeMessageMutation();
  const [confirmResolution, { isLoading: isConfirming }] = useConfirmDisputeResolutionMutation();

  const handleSendMessage = async (content: string) => {
    try {
      await addMessage({ disputeId: id, content }).unwrap();
      refetch();
    } catch (error: any) {
      const message = error?.data?.error?.message || "حدث خطأ أثناء إرسال الرسالة";
      toast.error(message);
    }
  };

  const handleConfirm = async (feedback: string) => {
    try {
      await confirmResolution({
        disputeId: id,
        input: { confirmed: true, feedback },
      }).unwrap();
      toast.success("تم تأكيد الحل", {
        description: "تم إغلاق التذكرة بنجاح. نأمل أن يكون التعاون مثمراً.",
      });
      setIsConfirmDialogOpen(false);
      refetch();
    } catch (error: any) {
      const message = error?.data?.error?.message || "حدث خطأ أثناء تأكيد الحل";
      toast.error(message);
    }
  };

  const handleEscalate = async (feedback: string) => {
    try {
      await confirmResolution({
        disputeId: id,
        input: { confirmed: false, feedback },
      }).unwrap();
      toast.success("تم التصعيد", {
        description: "تم تصعيد التذكرة للإدارة للمراجعة.",
      });
      setIsConfirmDialogOpen(false);
      refetch();
    } catch (error: any) {
      const message = error?.data?.error?.message || "حدث خطأ أثناء التصعيد";
      toast.error(message);
    }
  };

  if (isLoading) {
    return <DisputeDetailSkeleton />;
  }

  if (!dispute) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16" dir="rtl">
        <div className="text-6xl">🔍</div>
        <h1 className="text-xl font-semibold text-natural-100">التذكرة غير موجودة</h1>
        <p className="text-portal-note-text">لا يمكنك الوصول إلى هذه التذكرة</p>
        <Link href="/portal/disputes">
          <Button variant="outline" className="mt-4 rounded-xl">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للقائمة
          </Button>
        </Link>
      </div>
    );
  }

  const showConfirmButton = dispute.status === "PENDING_CLIENT";
  const canSendMessage = ["APPROVED", "IN_PROGRESS", "ESCALATED", "PENDING_CLIENT"].includes(
    dispute.status
  );

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <Link
          href="/portal/disputes"
          className="flex items-center gap-1 text-sm text-portal-note-text hover:text-secondary-500 transition-colors w-fit"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للنزاعات
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-secondary-500">
                #{dispute.ticketNumber.toString().padStart(3, "0")}
              </span>
              <DisputeStatusBadge status={dispute.status} />
              <span className="text-xs text-portal-note-text">
                الأولوية: {DISPUTE_PRIORITY_AR[dispute.priority]}
              </span>
            </div>            <h1 className="text-2xl font-semibold text-natural-100">{dispute.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-portal-note-text">
              <span>المشروع: {dispute.project.name}</span>
              <span>•</span>
              <span>مدير المشروع: {dispute.pm.name}</span>
              <span>•</span>
              <span>تاريخ الفتح: {new Date(dispute.openedAt).toLocaleDateString("ar-SA")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DisputeCategoryIcon category={dispute.category} showLabel size="md" />
          </div>
        </div>

        {/* ── Description Card ─────────────────────────────────────────────── */}
        <SurfaceCard className="p-4">
          <p className="text-sm font-medium text-natural-100 mb-2">وصف المشكلة:</p>
          <p className="text-sm text-portal-note-text leading-relaxed whitespace-pre-wrap">
            {dispute.description}
          </p>
        </SurfaceCard>

        {/* ── Action Area ──────────────────────────────────────────────────── */}
        {showConfirmButton && (
          <SurfaceCard className="p-4 bg-cyan-50/50 border-cyan-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                  <MessageSquare className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-natural-100">هل تم حل المشكلة؟</p>
                  <p className="text-sm text-portal-note-text">
                    {dispute.pm.name} أشار إلى أن المشكلة قد تم حلها
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsConfirmDialogOpen(true)}
                className="rounded-xl bg-cyan-600 hover:bg-cyan-700"
              >
                تأكيد أو تصعيد
              </Button>
            </div>
          </SurfaceCard>
        )}

        {/* ── Rejected/Resolved Banner ─────────────────────────────────────── */}
        {dispute.status === "REJECTED" && dispute.rejectionReason && (
          <SurfaceCard className="p-4 bg-gray-50 border-gray-200">
            <p className="text-sm font-medium text-natural-100 mb-2">سبب الرفض:</p>
            <p className="text-sm text-portal-note-text">{dispute.rejectionReason}</p>
          </SurfaceCard>
        )}

        {dispute.status === "RESOLVED" && dispute.resolution && (
          <SurfaceCard className="p-4 bg-green-50 border-green-200">
            <p className="text-sm font-medium text-natural-100 mb-2">ملاحظات الحل:</p>
            <p className="text-sm text-portal-note-text">{dispute.resolution}</p>
          </SurfaceCard>
        )}
      </div>

      {/* ── Message Thread ───────────────────────────────────────────────── */}
      <SurfaceCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-secondary-500" />
          <h2 className="text-lg font-semibold text-natural-100">الرسائل</h2>
        </div>
        <DisputeMessageThread
          messages={dispute.messages}
          onSendMessage={handleSendMessage}
          isLoading={isSendingMessage}
          canSendMessage={canSendMessage}
        />
      </SurfaceCard>

      {/* ── History ──────────────────────────────────────────────────────── */}
      {dispute.history.length > 0 && (
        <SurfaceCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-secondary-500" />
            <h2 className="text-lg font-semibold text-natural-100">سجل التحديثات</h2>
          </div>
          <div className="space-y-3">
            {dispute.history.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-xl border-[1.5px] border-portal-divider p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-natural-100">
                      {event.changer.name}
                    </span>
                    <span className="text-xs text-portal-note-text">
                      {new Date(event.changedAt).toLocaleString("ar-SA", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  {event.note && (
                    <p className="mt-1 text-sm text-portal-note-text">{event.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* ── Confirmation Dialog ──────────────────────────────────────────── */}
      <DisputeConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirm}
        onEscalate={handleEscalate}
        isLoading={isConfirming}
        pmName={dispute.pm.name}
      />
    </div>
  );
}

function DisputeDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <Skeleton className="h-8 w-24 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      </div>
      <Skeleton className="h-32 rounded-[24px]" />
      <Skeleton className="h-64 rounded-[24px]" />
    </div>
  );
}
