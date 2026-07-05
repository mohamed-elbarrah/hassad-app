"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  History,
  Clock,
  User,
  Building2,
  Check,
  X,
  ArrowRightLeft,
  Ban,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetAdminDisputeDetailQuery,
  useGetPmDisputeStatsQuery,
  useCloseDisputeMutation,
  useAddAdminMessageMutation,
} from "@/features/disputes/adminDisputesApi";
import {
  DISPUTE_STATUS_AR,
  DISPUTE_PRIORITY_AR,
  DISPUTE_CATEGORY_AR,
  type DisputeStatus,
} from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/design-system/Skeleton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DisputeStatusBadge,
  DisputeCategoryIcon,
  DisputeMessageThread,
} from "@/components/disputes";
import { DisputeResolutionTimer } from "@/components/disputes/DisputeResolutionTimer";
import { PmStatsPanel } from "@/components/disputes/PmStatsPanel";
import { DisputeApprovalDialog } from "@/components/disputes/DisputeApprovalDialog";
import { PmChangeDialog } from "@/components/disputes/PmChangeDialog";
import { Dialog } from "@/components/design-system/Dialog";
import { FormInput } from "@/components/design-system/FormInput";

interface AdminDisputeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminDisputeDetailPage({
  params,
}: AdminDisputeDetailPageProps) {
  const { id } = use(params);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [pmChangeDialogOpen, setPmChangeDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeResolution, setCloseResolution] = useState("");

  const {
    data: dispute,
    isLoading,
    refetch,
  } = useGetAdminDisputeDetailQuery(id, {
    pollingInterval: 30_000,
  });

  const { data: pmStats, isLoading: isLoadingPmStats } =
    useGetPmDisputeStatsQuery(dispute?.pm.id ?? "", { skip: !dispute?.pm.id });

  const [closeDispute, { isLoading: isClosing }] = useCloseDisputeMutation();
  const [addMessage, { isLoading: isSendingMessage }] =
    useAddAdminMessageMutation();

  const handleSendMessage = async (content: string) => {
    try {
      await addMessage({ id, input: { content, isInternal: true } }).unwrap();
      refetch();
    } catch (error: any) {
      const message =
        error?.data?.error?.message || "حدث خطأ أثناء إرسال الرسالة";
      toast.error(message);
    }
  };

  const handleClose = async () => {
    if (closeResolution.trim().length < 10) {
      toast.error("قرار الحل مطلوب", {
        description: "يجب أن يكون القرار 10 أحرف على الأقل",
      });
      return;
    }

    try {
      await closeDispute({
        id,
        input: { resolution: closeResolution.trim() },
      }).unwrap();
      toast.success("تم إغلاق التذكرة");
      setCloseDialogOpen(false);
      refetch();
    } catch (error: any) {
      const message =
        error?.data?.error?.message || "حدث خطأ أثناء إغلاق التذكرة";
      toast.error(message);
    }
  };

  if (isLoading) {
    return <DisputeDetailSkeleton />;
  }

  if (!dispute) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-16"
        dir="rtl"
      >
        <div className="text-6xl">🔍</div>
        <h1 className="text-xl font-semibold text-natural-100">
          التذكرة غير موجودة
        </h1>
        <p className="text-portal-note-text">لا يمكنك الوصول إلى هذه التذكرة</p>
        <Link href="/dashboard/admin/disputes">
          <Button variant="outline" className="mt-4 rounded-xl">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للقائمة
          </Button>
        </Link>
      </div>
    );
  }

  const canApprove = dispute.status === "PENDING_APPROVAL";
  const canReject = dispute.status === "PENDING_APPROVAL";
  const canChangePm = dispute.status === "ESCALATED";
  const canClose =
    dispute.status === "ESCALATED" ||
    dispute.status === "IN_PROGRESS" ||
    dispute.status === "PENDING_CLIENT";
  const canSendMessage =
    dispute.status !== "PENDING_APPROVAL" &&
    dispute.status !== "REJECTED" &&
    dispute.status !== "CLOSED";
  const showTimer = ["APPROVED", "IN_PROGRESS", "ESCALATED"].includes(
    dispute.status,
  );

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/admin/disputes"
          className="flex items-center gap-1 text-sm text-portal-note-text hover:text-secondary-500 transition-colors w-fit"
        >
          <ArrowRight className="h-4 w-4" />
          العودة لإدارة النزاعات
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
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
            <h1 className="text-2xl font-semibold text-natural-100">
              {dispute.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-portal-note-text">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(dispute.openedAt).toLocaleDateString("ar-SA")}
              </span>
              <DisputeCategoryIcon
                category={dispute.category}
                showLabel
                size="md"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showTimer && dispute.deadlineAt && (
              <DisputeResolutionTimer
                deadlineAt={dispute.deadlineAt}
                status={dispute.status}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Main Layout: Content + Sidebar ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Content ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* ── Parties Card ───────────────────────────────────────────────────── */}
          <SurfaceCard className="p-5">
            <h2 className="text-lg font-semibold text-natural-100 mb-4">
              أطراف النزاع
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-portal-note-text">العميل</p>
                  <p className="text-sm font-medium text-natural-100">
                    {dispute.client.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-portal-note-text">المدير</p>
                  <p className="text-sm font-medium text-natural-100">
                    {dispute.pm.name}
                  </p>
                  {dispute.pmChanged && dispute.newPm && (
                    <p className="text-xs text-green-600">
                      تم التغيير → {dispute.newPm.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-portal-note-text">المشروع</p>
                  <p className="text-sm font-medium text-natural-100">
                    {dispute.project.name}
                  </p>
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* ── Description Card ─────────────────────────────────────────────────── */}
          <SurfaceCard className="p-5">
            <h2 className="text-lg font-semibold text-natural-100 mb-3">
              وصف المشكلة
            </h2>
            <p className="text-sm text-portal-note-text leading-relaxed whitespace-pre-wrap">
              {dispute.description}
            </p>
            {dispute.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-xs text-red-600 mb-1">سبب الرفض:</p>
                <p className="text-sm text-red-800">
                  {dispute.rejectionReason}
                </p>
              </div>
            )}
          </SurfaceCard>

          {/* ── Action Banners ─────────────────────────────────────────────────── */}
          {canApprove && (
            <SurfaceCard className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-natural-100">
                      بانتظار الموافقة
                    </p>
                    <p className="text-sm text-portal-note-text">
                      راجع التذكرة وقرر الموافقة أو الرفض
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <X className="h-4 w-4 ml-1" />
                    رفض
                  </Button>
                  <Button
                    className="rounded-xl bg-green-600 hover:bg-green-700"
                    onClick={() => setApprovalDialogOpen(true)}
                  >
                    <Check className="h-4 w-4 ml-1" />
                    موافقة
                  </Button>
                </div>
              </div>
            </SurfaceCard>
          )}

          {canChangePm && (
            <SurfaceCard className="p-4 bg-red-50 border-red-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-800">تم التصعيد</p>
                    <p className="text-sm text-red-700">
                      {dispute.escalatedAt
                        ? `تم التصعيد: ${new Date(dispute.escalatedAt).toLocaleDateString("ar-SA")}`
                        : "هذه التذكرة تحتاج تدخل الإدارة"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => setPmChangeDialogOpen(true)}
                  >
                    <ArrowRightLeft className="h-4 w-4 ml-1" />
                    تغيير المدير
                  </Button>
                  <Button
                    className="rounded-xl bg-red-600 hover:bg-red-700"
                    onClick={() => setCloseDialogOpen(true)}
                  >
                    <Ban className="h-4 w-4 ml-1" />
                    إغلاق
                  </Button>
                </div>
              </div>
            </SurfaceCard>
          )}

          {canClose && dispute.status === "IN_PROGRESS" && (
            <SurfaceCard className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-natural-100">قيد المعالجة</p>
                  <p className="text-sm text-portal-note-text">
                    المدير يعمل على حل المشكلة. يمكنك إغلاق التذكرة إذا تم الحل.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          )}

          {dispute.resolution && (
            <SurfaceCard className="p-4 bg-green-50 border-green-200">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                قرار الحل:
              </h3>
              <p className="text-sm text-green-700">{dispute.resolution}</p>
            </SurfaceCard>
          )}

          {/* ── Message Thread ─────────────────────────────────────────────────── */}
          <SurfaceCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-secondary-500" />
              <h2 className="text-lg font-semibold text-natural-100">
                الرسائل
              </h2>
              <span className="text-xs text-portal-note-text">
                (الملاحظات الداخلية باللون الرمادي)
              </span>
            </div>
            <DisputeMessageThread
              messages={dispute.messages}
              onSendMessage={handleSendMessage}
              isLoading={isSendingMessage}
              canSendMessage={canSendMessage}
              showInternalBadge
            />
          </SurfaceCard>

          {/* ── History ──────────────────────────────────────────────────────── */}
          {dispute.history.length > 0 && (
            <SurfaceCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-secondary-500" />
                <h2 className="text-lg font-semibold text-natural-100">
                  سجل التحديثات
                </h2>
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
                        <span className="text-xs text-portal-note-text">
                          الحالة:
                        </span>
                        {event.fromStatus && (
                          <>
                            <DisputeStatusBadge
                              status={event.fromStatus}
                              className="text-xs"
                            />
                            <span className="text-xs">→</span>
                          </>
                        )}
                        <DisputeStatusBadge
                          status={event.toStatus}
                          className="text-xs"
                        />
                      </div>
                      {event.note && (
                        <p className="mt-1 text-sm text-portal-note-text">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* PM Stats Panel */}
          {dispute.pm.id && (
            <PmStatsPanel
              stats={pmStats}
              isLoading={isLoadingPmStats}
              pmId={dispute.pm.id}
            />
          )}

          {/* Category Card */}
          <SurfaceCard className="p-5">
            <h3 className="text-sm font-medium text-portal-note-text mb-2">
              التصنيف
            </h3>
            <DisputeCategoryIcon
              category={dispute.category}
              showLabel
              size="lg"
            />
          </SurfaceCard>
        </div>
      </div>

      {/* ── Dialogs ────────────────────────────────────────────────────────────── */}
      <DisputeApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        disputeId={id}
        disputeTitle={dispute.title}
        mode="approve"
        onSuccess={refetch}
      />

      <DisputeApprovalDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        disputeId={id}
        disputeTitle={dispute.title}
        mode="reject"
        onSuccess={refetch}
      />

      <PmChangeDialog
        open={pmChangeDialogOpen}
        onOpenChange={setPmChangeDialogOpen}
        disputeId={id}
        disputeTitle={dispute.title}
        currentPmId={dispute.pm.id}
        currentPmName={dispute.pm.name}
        projectName={dispute.project.name}
        onSuccess={refetch}
      />

      <Dialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        title="إغلاق التذكرة"
        description={`التذكرة: ${dispute.title}`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
              disabled={isClosing}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleClose}
              disabled={isClosing || closeResolution.trim().length < 10}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClosing ? "جارٍ..." : "إغلاق التذكرة"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-natural-100">
              قرار الحل <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full min-h-[120px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-secondary-500 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 resize-none"
              placeholder="اشرح سبب إغلاق التذكرة..."
              value={closeResolution}
              onChange={(e) => setCloseResolution(e.target.value)}
              dir="rtl"
            />
            <p className="text-xs text-portal-note-text">
              {closeResolution.trim().length}/10 أحرف على الأقل
            </p>
          </div>
        </div>
      </Dialog>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-24 rounded-[24px]" />
          <Skeleton className="h-64 rounded-[24px]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-[24px]" />
          <Skeleton className="h-24 rounded-[24px]" />
        </div>
      </div>
    </div>
  );
}
