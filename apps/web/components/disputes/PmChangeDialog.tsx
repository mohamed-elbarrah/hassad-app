"use client";

import { useId, useState } from "react";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
import {
  useChangePmMutation,
  useGetAdminPmOptionsQuery,
} from "@/features/admin/adminDisputesApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PmChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disputeId: string;
  disputeTitle: string;
  currentPmId: string;
  currentPmName: string;
  projectName: string;
  onSuccess?: () => void;
}

export function PmChangeDialog({
  open,
  onOpenChange,
  disputeId,
  disputeTitle,
  currentPmId,
  currentPmName,
  projectName,
  onSuccess,
}: PmChangeDialogProps) {
  const [newPmId, setNewPmId] = useState("");
  const [reason, setReason] = useState("");
  const id = useId();
  const [changePm, { isLoading: isChanging }] = useChangePmMutation();

  const { data: pmOptions = [], isLoading: isLoadingPms } =
    useGetAdminPmOptionsQuery(undefined, { skip: !open });

  const availablePms = pmOptions.filter((pm) => pm.id !== currentPmId);

  const handleSubmit = async () => {
    if (!newPmId) {
      toast.error("اختر مدير المشروع", { description: "يجب اختيار مدير جديد" });
      return;
    }

    if (reason.trim().length < 10) {
      toast.error("السبب مطلوب", {
        description: "يجب أن يكون السبب 10 أحرف على الأقل",
      });
      return;
    }

    try {
      await changePm({
        id: disputeId,
        input: { newPmId, reason: reason.trim() },
      }).unwrap();
      toast.success(adminSuccessMessage("DISPUTE_PM_CHANGED"));
      handleOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(adminErrorMessage(error));
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNewPmId("");
      setReason("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تغيير مدير المشروع</DialogTitle>
          <DialogDescription>{`التذكرة: ${disputeTitle}`}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="space-y-2 rounded-xl border bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">المدير الحالي:</span>
              <span className="text-sm font-medium">{currentPmName}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">المشروع:</span>
              <span className="text-sm font-medium">{projectName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-new-pm`}>
              المدير الجديد <span className="text-destructive">*</span>
            </Label>
            {isLoadingPms ? (
              <Skeleton className="h-10 w-full" />
            ) : availablePms.length === 0 ? (
              <p className="text-sm text-destructive">لا يوجد مديرون آخرون متاحون</p>
            ) : (
              <Select value={newPmId} onValueChange={setNewPmId}>
                <SelectTrigger id={`${id}-new-pm`} className="w-full" aria-label="مدير المشروع الجديد">
                  <SelectValue placeholder="اختر المدير الجديد" />
                </SelectTrigger>
                <SelectContent>
                  {availablePms.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-change-reason`}>
              سبب التغيير <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id={`${id}-change-reason`}
              className="min-h-[100px]"
              placeholder="اشرح سبب تغيير المدير..."
              value={reason}
              aria-label="سبب تغيير مدير المشروع"
              onChange={(e) => setReason(e.target.value)}
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground">{reason.trim().length}/10 أحرف على الأقل</p>
          </div>

          <div className="flex gap-3 rounded-xl border border-warning/20 bg-warning/10 p-3 text-warning-foreground">
            <AlertTriangle className="mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="mb-1 font-medium">تنبيه</p>
              <ul className="list-inside list-disc space-y-1">
                <li>سيتم نقل جميع مهام المشروع للمدير الجديد</li>
                <li>سيتم إشعار العميل والمديرين القديم والجديد</li>
                <li>سيتم إغلاق التذكرة بعد التغيير</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isChanging}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isChanging || !newPmId || reason.trim().length < 10}
          >
            {isChanging ? "جارٍ..." : (
              <>
                <ArrowRightLeft data-icon="inline-start" />
                تغيير المدير
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
