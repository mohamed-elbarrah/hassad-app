"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@hassad/shared";
import { useChangePmMutation } from "@/features/admin/adminDisputesApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
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
  const [changePm, { isLoading: isChanging }] = useChangePmMutation();

  const { data: pmsData, isLoading: isLoadingPms } = useSearchUsersQuery(
    { role: UserRole.PM, limit: 100 },
    { skip: !open },
  );

  const availablePms = (pmsData?.items ?? []).filter((pm) => pm.id !== currentPmId);

  useEffect(() => {
    if (open) {
      setNewPmId("");
      setReason("");
    }
  }, [open]);

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
      toast.success("تم تغيير مدير المشروع", {
        description: "تم إشعار جميع الأطراف بالتغيير.",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      const message = error?.data?.error?.message || "حدث خطأ أثناء تغيير المدير";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <label className="text-sm font-medium">
              المدير الجديد <span className="text-destructive">*</span>
            </label>
            {isLoadingPms ? (
              <Skeleton className="h-10 w-full" />
            ) : availablePms.length === 0 ? (
              <p className="text-sm text-destructive">لا يوجد مديرون آخرون متاحون</p>
            ) : (
              <Select value={newPmId} onValueChange={setNewPmId}>
                <SelectTrigger className="w-full">
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
            <label className="text-sm font-medium">
              سبب التغيير <span className="text-destructive">*</span>
            </label>
            <Textarea
              className="min-h-[100px]"
              placeholder="اشرح سبب تغيير المدير..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground">{reason.trim().length}/10 أحرف على الأقل</p>
          </div>

          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isChanging}>
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
