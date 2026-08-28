"use client";

import { useId, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
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
import { Label } from "@/components/ui/label";
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
  const id = useId();

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
      toast.success(adminSuccessMessage("DISPUTE_APPROVED"));
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    } catch (error: unknown) {
      toast.error(adminErrorMessage(error));
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
      toast.success(adminSuccessMessage("DISPUTE_REJECTED"));
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    } catch (error: unknown) {
      toast.error(adminErrorMessage(error));
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
              <Label htmlFor={`${id}-priority`}>
                الأولوية
              </Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as DisputePriority)}>
                <SelectTrigger id={`${id}-priority`} className="w-full" aria-label="أولوية النزاع">
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
              <Label htmlFor={`${id}-approval-notes`}>
                ملاحظات (اختياري)
              </Label>
              <Input
                id={`${id}-approval-notes`}
                placeholder="ملاحظات داخلية..."
                value={notes}
                aria-label="ملاحظات الموافقة"
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                هذه الملاحظات داخلية فقط ولن يراها العميل أو المدير.
              </p>
            </div>

            <div className="rounded-xl border border-info/20 bg-info/10 p-3">
              <p className="text-sm text-info">
                بعد الموافقة، سيتم إشعار مدير المشروع وسيكون لديه 3 أيام لحل
                المشكلة.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${id}-rejection-reason`}>
                سبب الرفض <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`${id}-rejection-reason`}
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

            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
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
