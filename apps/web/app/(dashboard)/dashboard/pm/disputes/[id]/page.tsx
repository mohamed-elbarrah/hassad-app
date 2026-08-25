"use client";

import { use, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Play } from "lucide-react";
import {
  useAcknowledgeDisputeMutation,
  useAddPmDisputeMessageMutation,
  useGetPmDisputeDetailQuery,
  useResolveDisputeMutation,
} from "@/features/disputes/pmDisputesApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DisputeDetailEmptyState, DisputeDetailPattern } from "@/components/disputes/DisputeDetailPattern";
import { PmResolveDialog } from "@/components/disputes/PmResolveDialog";
import { pmErrorMessage, pmSuccessMessage } from "@/lib/i18n";

interface PmDisputeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PmDisputeDetailPage({ params }: PmDisputeDetailPageProps) {
  const { id } = use(params);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);

  const {
    data: dispute,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetPmDisputeDetailQuery(id, {
    pollingInterval: 30_000,
  });

  const [acknowledge, { isLoading: isAcknowledging }] = useAcknowledgeDisputeMutation();
  const [addMessage, { isLoading: isSendingMessage }] = useAddPmDisputeMessageMutation();
  const [resolveDispute, { isLoading: isResolving }] = useResolveDisputeMutation();

  const handleAcknowledge = async () => {
    try {
      await acknowledge(id).unwrap();
      toast.success(pmSuccessMessage("DISPUTE_ACKNOWLEDGED"));
      refetch();
    } catch (error) {
      toast.error(pmErrorMessage(error));
    }
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    try {
      await addMessage({ disputeId: id, input: { content }, files }).unwrap();
      refetch();
    } catch (error) {
      toast.error(pmErrorMessage(error));
    }
  };

  const handleResolve = async (message: string) => {
    try {
      await resolveDispute({ disputeId: id, input: { message } }).unwrap();
      toast.success(pmSuccessMessage("DISPUTE_RESOLVED"));
      setIsResolveDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(pmErrorMessage(error));
    }
  };

  if (isLoading) {
    return null;
  }

  if (isError || !dispute) {
    return (
      <DisputeDetailEmptyState
        title="حدث خطأ أثناء تحميل بيانات النزاع"
        description={pmErrorMessage(error)}
        backHref="/dashboard/pm/disputes"
        backLabel="العودة إلى النزاعات"
      />
    );
  }

  const canAcknowledge = dispute.status === "APPROVED";
  const canResolve = dispute.status === "IN_PROGRESS";
  const canSendMessage = ["APPROVED", "IN_PROGRESS", "ESCALATED", "PENDING_CLIENT"].includes(
    dispute.status,
  );

  const actionBanner = canAcknowledge ? (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">تذكرة جديدة بانتظار البدء</p>
          <p className="text-sm text-muted-foreground">
            أقر باستلام النزاع لبدء العمل عليه رسمياً.
          </p>
        </div>
        <Button onClick={handleAcknowledge} disabled={isAcknowledging}>
          <Play aria-hidden="true" data-icon="inline-start" />
          {isAcknowledging ? "جارٍ..." : "بدء المعالجة"}
        </Button>
      </CardContent>
    </Card>
  ) : canResolve ? (
    <Card className="border-success-200 bg-success-100">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-success-800">هل تم حل المشكلة؟</p>
          <p className="text-sm text-success-700">
            أرسل شرح الحل ليتمكن العميل من التأكيد أو طلب التصعيد.
          </p>
        </div>
        <Button onClick={() => setIsResolveDialogOpen(true)}>
          <CheckCircle2 aria-hidden="true" data-icon="inline-start" />
          تأكيد الحل
        </Button>
      </CardContent>
    </Card>
  ) : null;

  return (
    <>
      <DisputeDetailPattern
        audience="pm"
        title="تفاصيل النزاع"
        backHref="/dashboard/pm/disputes"
        backLabel="العودة إلى النزاعات"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "نزاعاتي", href: "/dashboard/pm/disputes" },
          { label: dispute.title },
        ]}
        dispute={{
          ...dispute,
          client: dispute.client,
          pm: { id: "", name: "مدير المشروع" },
        }}
        actionBanner={actionBanner}
        onSendMessage={handleSendMessage}
        isSendingMessage={isSendingMessage}
        canSendMessage={canSendMessage}
        overviewFields={[
          {
            label: "العميل",
            value: dispute.client.companyName ?? dispute.client.user?.name ?? "—",
          },
          { label: "المشروع", value: dispute.project.name || "—" },
        ]}
        timelineFields={[
          { label: "آخر حالة", value: dispute.status },
          { label: "الموعد النهائي", value: dispute.deadlineAt || "—" },
        ]}
        messagesDescription="راسل العميل مباشرة من داخل هذا الملف وتابع ردوده."
        attachmentsDescription="مرفقات النزاع المرتبطة بالمحادثة والحالة."
      />

      <PmResolveDialog
        open={isResolveDialogOpen}
        onOpenChange={setIsResolveDialogOpen}
        onResolve={handleResolve}
        isLoading={isResolving}
      />
    </>
  );
}
