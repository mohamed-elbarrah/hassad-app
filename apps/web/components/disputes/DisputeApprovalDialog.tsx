"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  useApproveDisputeMutation,
  useRejectDisputeMutation,
  type ApproveDisputeInput,
} from "@/features/disputes/pmDisputesApi";
import { DisputePriority, DISPUTE_PRIORITY_AR } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/design-system/Dialog";
import { FormInput } from "@/components/design-system/FormInput";
import {
  FormSelect,
  FormSelectContent,
  FormSelectItem,
  FormSelectTrigger,
  FormSelectValue,
} from "@/components/design-system/FormSelectControl";

interface DisputeApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disputeId: string;
  disputeTitle: string;
  mode: "approve" | "reject";
  onSuccess?: () => void;
}

const PRIORITIES = Object.values(DisputePriority);

export function DisputeApprovalDialog({
  open,
  onOpenChange,
  disputeId,
  disputeTitle,
  mode,
  onSuccess,
}: DisputeApprovalDialogProps) {
  const [priority, setPriority] = useState<DisputePriority>(
    DisputePriority.NORMAL,
  );
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  const [approveDispute, { isLoading: isApproving }] =
    useApproveDisputeMutation();
  const [rejectDispute, { isLoading: isRejecting }] =
    useRejectDisputeMutation();

  const isLoading = isApproving || isRejecting;

  const handleApprove = async () => {
    const input: ApproveDisputeInput = {
      priority,
      notes: notes.trim() || undefined,
    };

    try {
      await approveDispute({ id: disputeId, input }).unwrap();
      toast.success("تمت الموافقة على التذكرة", {
        description: "تم إشعار مدير المشروع بالتذكرة الجديدة.",
      });
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    } catch (error: any) {
      const message =
        error?.data?.error?.message || "حدث خطأ أثناء الموافقة على التذكرة";
      toast.error(message);
    }
  };

  const handleReject = async () => {
    if (reason.trim().length < 10) {
      toast.error("السبب مطلوب", {
        description: "يجب أن يكون السبب 10 أحرف على الأقل",
      });
      return;
    }

    try {
      await rejectDispute({
        id: disputeId,
        input: { reason: reason.trim() },
      }).unwrap();
      toast.success("تم رفض التذكرة", {
        description: "تم إشعار العميل بقرار الرفض.",
      });
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    } catch (error: any) {
      const message =
        error?.data?.error?.message || "حدث خطأ أثناء رفض التذكرة";
      toast.error(message);
    }
  };

  const resetForm = () => {
    setPriority(DisputePriority.NORMAL);
    setNotes("");
    setReason("");
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title={mode === "approve" ? "الموافقة على التذكرة" : "رفض التذكرة"}
      description={`التذكرة: ${disputeTitle}`}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            إلغاء
          </Button>
          {mode === "approve" ? (
            <Button
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                "جارٍ..."
              ) : (
                <>
                  <Check className="h-4 w-4 ml-2" />
                  موافقة
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleReject}
              disabled={isLoading || reason.trim().length < 10}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                "جارٍ..."
              ) : (
                <>
                  <X className="h-4 w-4 ml-2" />
                  رفض
                </>
              )}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4" dir="rtl">
        {mode === "approve" ? (
          <>
            {/* Priority Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-natural-100">
                الأولوية
              </label>
              <FormSelect
                value={priority}
                onValueChange={(v) => setPriority(v as DisputePriority)}
              >
                <FormSelectTrigger className="w-full">
                  <FormSelectValue placeholder="اختر الأولوية" />
                </FormSelectTrigger>
                <FormSelectContent>
                  {PRIORITIES.map((p) => (
                    <FormSelectItem key={p} value={p}>
                      {DISPUTE_PRIORITY_AR[p]}
                    </FormSelectItem>
                  ))}
                </FormSelectContent>
              </FormSelect>
            </div>

            {/* Optional Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-natural-100">
                ملاحظات (اختياري)
              </label>
              <FormInput
                placeholder="ملاحظات داخلية..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="text-xs text-portal-note-text">
                هذه الملاحظات داخلية فقط ولن يراها العميل أو المدير.
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800">
                بعد الموافقة، سيتم إشعار مدير المشروع وسيكون لديه 3 أيام لحل
                المشكلة.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Rejection Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-natural-100">
                سبب الرفض <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full min-h-[120px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-secondary-500 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 resize-none"
                placeholder="اشرح سبب رفض التذكرة..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                dir="rtl"
              />
              <p className="text-xs text-portal-note-text">
                {reason.trim().length}/10 أحرف على الأقل
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-800">
                سيتم إشعار العميل برفض التذكرة مع السبب المذكور.
              </p>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
