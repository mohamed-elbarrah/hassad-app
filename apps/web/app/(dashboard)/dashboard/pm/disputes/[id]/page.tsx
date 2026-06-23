"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare, History, Clock, User, Building2, Play, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useGetPmDisputeDetailQuery,
  useAcknowledgeDisputeMutation,
  useAddPmDisputeMessageMutation,
  useResolveDisputeMutation,
} from "@/features/disputes/pmDisputesApi";
import { DISPUTE_STATUS_AR, DISPUTE_PRIORITY_AR, type DisputeStatus } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/design-system/Skeleton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import {
  DisputeStatusBadge,
  DisputeCategoryIcon,
  DisputeMessageThread,
  PmResolveDialog,
} from "@/components/disputes";
import { DisputeResolutionTimer } from "@/components/disputes/DisputeResolutionTimer";

interface PmDisputeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PmDisputeDetailPage({ params }: PmDisputeDetailPageProps) {
  const { id } = use(params);
  const [isAcknowledgeLoading, setIsAcknowledgeLoading] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);

  const {
    data: dispute,
    isLoading,
    refetch,
  } = useGetPmDisputeDetailQuery(id, {
    pollingInterval: 30_000,
  });

  const [acknowledge] = useAcknowledgeDisputeMutation();
  const [addMessage] = useAddPmDisputeMessageMutation();
  const [resolveDispute] = useResolveDisputeMutation();

  const handleAcknowledge = async () => {
    setIsAcknowledgeLoading(true);
    try {
      await acknowledge(id).unwrap();
      toast.success("تم بدء المعالجة", {
        description: "تم تحديث حالة التذكرة إلى قيد المعالجة.",
      });
      refetch();
    } catch (error: any) {
      const message = error?.data?.error?.message || "حدث خطأ أثناء تحديث الحالة";
      toast.error(message);
    } finally {
      setIsAcknowledgeLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await addMessage({ disputeId: id, input: { content } }).unwrap();
      refetch();
    } catch (error: any) {
      const message = error?.data?.error?.message || "حدث خطأ أثناء إرسال الرسالة";
      toast.error(message);
    }
  };

  const handleResolve = async (message: string) => {
    try {
      await resolveDispute({ disputeId: id, input: { message } }).unwrap();
      toast.success("تم تأكيد الحل", {
        description: "تم إرسال طلب التأكيد للعميل.",
      });
      setIsResolveDialogOpen(false);
      refetch();
    } catch (error: any) {
      const message = error?.data?.error?.message || "حدث خطأ أثناء تأكيد الحل";
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
        <Link href="/dashboard/pm/disputes">
          <Button variant="outline" className="mt-4 rounded-xl">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للقائمة
          </Button>
        </Link>
      </div>
    );
  }

  const canAcknowledge = dispute.status === "APPROVED";
  const canSendMessage = ["APPROVED", "IN_PROGRESS", "ESCALATED"].includes(dispute.status);
  const canResolve = dispute.status === "IN_PROGRESS";
  const showTimer = ["APPROVED", "IN_PROGRESS", "ESCALATED"].includes(dispute.status);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/pm/disputes"
          className="flex items-center gap-1 text-sm text-portal-note-text hover:text-secondary-500 transition-colors w-fit"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للنزاعات
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-secondary-500">
                #{dispute.ticketNumber.toString().padStart(3, "0")}
              </span>
              <DisputeStatusBadge status={dispute.status} />
              <span className="text-xs text-portal-note-text">
                الأولوية: {DISPUTE_PRIORITY_AR[dispute.priority]}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-natural-100">{dispute.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-portal-note-text">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {dispute.client.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {dispute.project.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(dispute.openedAt).toLocaleDateString("ar-SA")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DisputeCategoryIcon category={dispute.category} showLabel size="md" />
            {showTimer && (
              <DisputeResolutionTimer
                deadlineAt={dispute.deadlineAt}
                status={dispute.status}
              />
            )}
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
        {canAcknowledge && (
          <SurfaceCard className="p-4 bg-blue-50/50 border-blue-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Play className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-natural-100">تذكرة جديدة</p>
                  <p className="text-sm text-portal-note-text">
                    اضغط "بدء المعالجة" للإقرار باستلام التذكرة والبدء في حلها
                  </p>
                </div>
              </div>
              <Button
                onClick={handleAcknowledge}
                disabled={isAcknowledgeLoading}
                className="rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                {isAcknowledgeLoading ? "جارٍ..." : "بدء المعالجة"}
              </Button>
            </div>
          </SurfaceCard>
        )}

        {canResolve && (
          <SurfaceCard className="p-4 bg-green-50/50 border-green-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-natural-100">هل تم حل المشكلة؟</p>
                  <p className="text-sm text-portal-note-text">
                    اضغط "تأكيد الحل" لإرسال طلب تأكيد للعميل
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsResolveDialogOpen(true)}
                className="rounded-xl bg-green-600 hover:bg-green-700"
              >
                تأكيد الحل
              </Button>
            </div>
          </SurfaceCard>
        )}

        {/* ── Escalated/Resolved Banner ─────────────────────────────────────── */}
        {dispute.status === "ESCALATED" && (
          <SurfaceCard className="p-4 bg-red-50/50 border-red-200">
            <p className="text-sm font-medium text-red-800 mb-2">
              ⚠️ تم تصعيد هذه التذكرة للإدارة
            </p>
            <p className="text-sm text-red-700">
              لا يمكنك إجراء أي تعديلات. الإدارة تتولى الأمر الآن.
            </p>
          </SurfaceCard>
        )}

        {dispute.status === "PENDING_CLIENT" && (
          <SurfaceCard className="p-4 bg-cyan-50/50 border-cyan-200">
            <p className="text-sm font-medium text-cyan-800 mb-2">
              ⏳ بانتظار تأكيد العميل
            </p>
            <p className="text-sm text-cyan-700">
              تم إرسال طلب التأكيد للعميل. سيتم إغلاق التذكرة تلقائياً بعد تأكيد العميل.
            </p>
          </SurfaceCard>
        )}

        {dispute.status === "RESOLVED" && dispute.resolution && (
          <SurfaceCard className="p-4 bg-green-50 border-green-200">
            <p className="text-sm font-medium text-natural-100 mb-2">ملاحظات الحل:</p>
            <p className="text-sm text-portal-note-text">{dispute.resolution}</p>
          </SurfaceCard>
        )}
      </div>

      {/* ── Message Thread ─────────────────────────────────────────────────── */}
      <SurfaceCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-secondary-500" />
          <h2 className="text-lg font-semibold text-natural-100">الرسائل</h2>
        </div>
        <DisputeMessageThread
          messages={dispute.messages}
          onSendMessage={handleSendMessage}
          isLoading={false}
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
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-portal-note-text">الحالة:</span>
                    {event.fromStatus && (
                      <>
                        <DisputeStatusBadge status={event.fromStatus} className="text-xs" />
                        <span className="text-xs">→</span>
                      </>
                    )}
                    <DisputeStatusBadge status={event.toStatus} className="text-xs" />
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

      {/* ── Resolve Dialog ─────────────────────────────────────────────────── */}
      <PmResolveDialog
        open={isResolveDialogOpen}
        onOpenChange={setIsResolveDialogOpen}
        onResolve={handleResolve}
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