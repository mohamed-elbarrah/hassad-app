"use client";

import { use, useState } from "react";
import { toast } from "sonner";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared/AdminDetailSkeleton";
import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";
import { CheckCircle2, RefreshCw, UserCog, XCircle } from "lucide-react";
import {
  useAddAdminDisputeMessageMutation,
  useCloseDisputeMutation,
  useGetAdminDisputeByIdQuery,
} from "@/features/admin/adminDisputesApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DisputeApprovalDialog } from "@/components/disputes/DisputeApprovalDialog";
import { PmChangeDialog } from "@/components/disputes/PmChangeDialog";
import { DisputeDetailPattern } from "@/components/disputes/DisputeDetailPattern";
import { formatDateTime, formatNumber } from "@/lib/format";

export default function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [changePmDialogOpen, setChangePmDialogOpen] = useState(false);
  const [closeNote, setCloseNote] = useState("");

  const { data: dispute, isLoading, isError, refetch, error } = useGetAdminDisputeByIdQuery(id);
  const [addInternalMessage, { isLoading: isSendingMessage }] =
    useAddAdminDisputeMessageMutation();
  const [closeDispute, { isLoading: isClosing }] = useCloseDisputeMutation();

  const handleSendMessage = async (content: string) => {
    try {
      await addInternalMessage({
        disputeId: id,
        input: { content },
      }).unwrap();
      toast.success(adminSuccessMessage("DISPUTE_MESSAGE_ADDED"));
      refetch();
    } catch (error: unknown) {
      toast.error(adminErrorMessage(error));
    }
  };

  const handleCloseDispute = async () => {
    try {
      await closeDispute({
        id,
        input: { resolution: closeNote.trim() },
      }).unwrap();
      toast.success(adminSuccessMessage("DISPUTE_CLOSED"));
      setCloseNote("");
      refetch();
    } catch (error: unknown) {
      toast.error(adminErrorMessage(error));
    }
  };

  if (isLoading) return <AdminDetailSkeleton />;

  if (isError || !dispute) {
    return (
      <AdminPageError
        title="تعذر تحميل بيانات النزاع"
        description={adminErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  const actionBanner =
    dispute.status === "PENDING_APPROVAL" ? (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-amber-900">النزاع بانتظار قرار الإدارة</p>
            <p className="text-sm text-amber-800">
              راجع الوصف وسجل الرسائل ثم اختر الموافقة أو الرفض أو إعادة التعيين.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dispute.capabilities.approve ? (
              <Button onClick={() => setApproveDialogOpen(true)}>
                <CheckCircle2 data-icon="inline-start" />
                موافقة
              </Button>
            ) : null}
            {dispute.capabilities.reject ? (
              <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
                <XCircle data-icon="inline-start" />
                رفض
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    ) : dispute.status === "ESCALATED" ? (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4">
          <p className="font-medium text-destructive">النزاع مصعّد للإدارة</p>
          <p className="mt-1 text-sm text-muted-foreground">
            يوصى باتخاذ قرار مباشر أو إعادة تعيين مدير المشروع إذا كان ذلك يساعد على إنهاء الملف.
          </p>
        </CardContent>
      </Card>
    ) : null;

  const actionTab = (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>إجراءات الإدارة</CardTitle>
        <CardDescription>تحكم إداري مباشر في مسار النزاع من مكان واحد.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {dispute.capabilities.approve ? (
            <Button onClick={() => setApproveDialogOpen(true)}>
              <CheckCircle2 data-icon="inline-start" />
              موافقة
            </Button>
          ) : null}
          {dispute.capabilities.reject ? (
            <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
              <XCircle data-icon="inline-start" />
              رفض
            </Button>
          ) : null}
          {dispute.capabilities.changePm ? (
            <Button variant="outline" onClick={() => setChangePmDialogOpen(true)}>
              <UserCog data-icon="inline-start" />
              تغيير مدير المشروع
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw data-icon="inline-start" />
            تحديث البيانات
          </Button>
        </div>

        {dispute.capabilities.close ? (
          <div className="flex flex-col gap-3 rounded-xl border p-4">
            <div>
              <p className="font-medium">إغلاق النزاع</p>
              <p className="text-sm text-muted-foreground">
                أضف خلاصة مختصرة قبل إغلاق الملف نهائياً.
              </p>
            </div>
            <label htmlFor="admin-dispute-close-note" className="text-sm font-medium">خلاصة الإغلاق</label>
            <Textarea
              id="admin-dispute-close-note"
              value={closeNote}
              onChange={(e) => setCloseNote(e.target.value)}
              placeholder="اكتب ملخص القرار أو الحل النهائي..."
              className="min-h-[120px]"
              dir="rtl"
            />
            <div className="flex justify-end">
              <Button onClick={handleCloseDispute} disabled={isClosing}>
                {isClosing ? "جارٍ الإغلاق..." : "إغلاق النزاع"}
              </Button>
            </div>
          </div>
        ) : null}

        {dispute.pmStats ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "كل نزاعات المدير", value: formatNumber(dispute.pmStats.totalDisputes) },
              { label: "تم حلها", value: formatNumber(dispute.pmStats.resolvedDisputes) },
              { label: "تم تصعيدها", value: formatNumber(dispute.pmStats.escalatedDisputes) },
              {
                label: "متوسط الحل",
                value: dispute.pmStats.avgResolutionDays
                  ? `${formatNumber(Math.round(dispute.pmStats.avgResolutionDays))} يوم`
                  : "—",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  return (
    <>
      <DisputeDetailPattern
        audience="admin"
        title="تفاصيل النزاع"
        backHref="/dashboard/admin/disputes"
        backLabel="العودة إلى النزاعات"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "النزاعات", href: "/dashboard/admin/disputes" },
          { label: dispute.title },
        ]}
        projectHref={`/dashboard/admin/projects/${dispute.projectId}`}
        dispute={dispute}
        actionBanner={actionBanner}
        actionTab={actionTab}
        onSendMessage={handleSendMessage}
        isSendingMessage={isSendingMessage}
        canSendMessage={dispute.capabilities.message}
        allowAttachments={false}
        showInternalMessages
        overviewFields={[
          { label: "العميل", value: dispute.client.companyName || "—" },
          { label: "المشروع", value: dispute.project.name || "—" },
          { label: "مدير المشروع", value: dispute.pm.name || "—" },
          { label: "المراجع", value: dispute.reviewer?.name || "—" },
          { label: "المعالج", value: dispute.resolver?.name || "—" },
        ]}
        timelineFields={[
          { label: "تاريخ الموافقة", value: dispute.approvedAt ? formatDateTime(dispute.approvedAt) : "—" },
          { label: "تاريخ التصعيد", value: dispute.escalatedAt ? formatDateTime(dispute.escalatedAt) : "—" },
          { label: "تاريخ الحل", value: dispute.resolvedAt ? formatDateTime(dispute.resolvedAt) : "—" },
          { label: "تاريخ الإغلاق", value: dispute.closedAt ? formatDateTime(dispute.closedAt) : "—" },
          { label: "إشعار العميل", value: dispute.clientNotifiedAt ? formatDateTime(dispute.clientNotifiedAt) : "—" },
          { label: "رد العميل", value: dispute.clientRespondedAt ? formatDateTime(dispute.clientRespondedAt) : "—" },
        ]}
        messagesDescription="تظهر هنا المراسلات والملاحظات الداخلية الخاصة بالإدارة."
        attachmentsDescription="كل الملفات المرفوعة ضمن هذا النزاع."
      />

      <DisputeApprovalDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        disputeId={dispute.id}
        disputeTitle={dispute.title}
        mode="approve"
        onSuccess={refetch}
      />
      <DisputeApprovalDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        disputeId={dispute.id}
        disputeTitle={dispute.title}
        mode="reject"
        onSuccess={refetch}
      />
      <PmChangeDialog
        open={changePmDialogOpen}
        onOpenChange={setChangePmDialogOpen}
        disputeId={dispute.id}
        disputeTitle={dispute.title}
        currentPmId={dispute.pmId}
        currentPmName={dispute.pm.name}
        projectName={dispute.project.name}
        onSuccess={refetch}
      />
    </>
  );
}
