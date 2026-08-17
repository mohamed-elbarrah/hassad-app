"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  useApproveDisputeMutation,
  useRejectDisputeMutation,
  type ApproveDisputeInput,
} from "@/features/admin/adminDisputesApi";
import { DisputePriority, DISPUTE_PRIORITY_AR } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>{mode === "approve" ? "الموافقة على التذكرة" : "رفض التذكرة"}</DialogTitle>
          <DialogDescription>{`التذكرة: ${disputeTitle}`}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
        {mode === "approve" ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                الأولوية
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as DisputePriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {DISPUTE_PRIORITY_AR[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                ملاحظات (اختياري)
              </label>
              <Input
                placeholder="ملاحظات داخلية..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                سبب الرفض <span className="text-red-500">*</span>
              </label>
              <Textarea
                className="min-h-[120px]"
                placeholder="اشرح سبب رفض التذكرة..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                dir="rtl"
              />
              <p className="text-xs text-muted-foreground">
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

        <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            إلغاء
          </Button>
          {mode === "approve" ? (
            <Button onClick={handleApprove} disabled={isLoading}>
              {isLoading ? "جارٍ..." : (
                <>
                  <Check data-icon="inline-start" />
                  موافقة
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleReject} disabled={isLoading || reason.trim().length < 10} variant="destructive">
              {isLoading ? "جارٍ..." : (
                <>
                  <X data-icon="inline-start" />
                  رفض
                </>
              )}
            </Button>
          )}
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
