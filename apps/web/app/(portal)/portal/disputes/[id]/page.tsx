"use client";

import { use, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { DisputeStatus } from "@hassad/shared";
import {
  useAddDisputeMessageMutation,
  useConfirmDisputeResolutionMutation,
  useGetClientDisputeDetailQuery,
} from "@/features/portal/portalApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DisputeConfirmationDialog } from "@/components/disputes/DisputeConfirmationDialog";
import { DisputeDetailEmptyState, DisputeDetailPattern } from "@/components/disputes/DisputeDetailPattern";

interface PortalDisputeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PortalDisputeDetailPage({
  params,
}: PortalDisputeDetailPageProps) {
  const { id } = use(params);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const { data: dispute, isLoading, refetch } = useGetClientDisputeDetailQuery(id, {
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });

  const [addMessage, { isLoading: isSendingMessage }] = useAddDisputeMessageMutation();
  const [confirmResolution, { isLoading: isConfirming }] =
    useConfirmDisputeResolutionMutation();

  const handleSendMessage = async (content: string, files?: File[]) => {
    try {
      await addMessage({ disputeId: id, content, files }).unwrap();
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
      toast.success("تم تأكيد الحل");
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
      toast.success("تم تصعيد النزاع");
      setIsConfirmDialogOpen(false);
      refetch();
    } catch (error: any) {
      const message = error?.data?.error?.message || "حدث خطأ أثناء التصعيد";
      toast.error(message);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!dispute) {
    return (
      <DisputeDetailEmptyState
        title="حدث خطأ أثناء تحميل بيانات النزاع"
        description="تعذر فتح التذكرة المطلوبة حالياً."
        backHref="/portal/disputes"
        backLabel="العودة إلى النزاعات"
      />
    );
  }

  const showConfirmButton = dispute.status === DisputeStatus.PENDING_CLIENT;
  const canSendMessage = [
    DisputeStatus.APPROVED,
    DisputeStatus.IN_PROGRESS,
    DisputeStatus.ESCALATED,
    DisputeStatus.PENDING_CLIENT,
  ].includes(dispute.status as DisputeStatus);

  const actionBanner = showConfirmButton ? (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">بانتظار تأكيدك</p>
          <p className="text-sm text-muted-foreground">
            مدير المشروع أرسل حلاً. يمكنك تأكيده أو طلب تصعيده للإدارة.
          </p>
        </div>
        <Button onClick={() => setIsConfirmDialogOpen(true)}>
          <CheckCircle2 data-icon="inline-start" />
          تأكيد أو تصعيد
        </Button>
      </CardContent>
    </Card>
  ) : null;

  return (
    <>
      <DisputeDetailPattern
        audience="client"
        title="تفاصيل التذكرة"
        backHref="/portal/disputes"
        backLabel="العودة إلى النزاعات"
        breadcrumbs={[
          { label: "النزاعات", href: "/portal/disputes" },
          { label: dispute.title },
        ]}
        dispute={dispute}
        actionBanner={actionBanner}
        onSendMessage={handleSendMessage}
        isSendingMessage={isSendingMessage}
        canSendMessage={canSendMessage}
        overviewFields={[
          { label: "المشروع", value: dispute.project.name || "—" },
          { label: "مدير المشروع", value: dispute.pm.name || "—" },
          { label: "سبب الرفض", value: dispute.rejectionReason || "—" },
          { label: "ملاحظات الحل", value: dispute.resolution || "—" },
        ]}
        timelineFields={[
          { label: "تاريخ الفتح", value: dispute.openedAt || "—" },
          { label: "الموعد النهائي", value: dispute.deadlineAt || "—" },
        ]}
        messagesDescription="راسل فريق المشروع مباشرة من نفس بطاقة التذكرة."
        attachmentsDescription="الملفات المرفقة داخل التذكرة."
      />

      <DisputeConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirm}
        onEscalate={handleEscalate}
        isLoading={isConfirming}
        pmName={dispute.pm.name}
      />
    </>
  );
}
