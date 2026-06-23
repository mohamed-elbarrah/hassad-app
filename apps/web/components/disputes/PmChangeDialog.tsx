"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import {
  useChangePmMutation,
} from "@/features/disputes/adminDisputesApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { UserRole } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/design-system/Dialog";
import {
  FormSelect,
  FormSelectContent,
  FormSelectItem,
  FormSelectTrigger,
  FormSelectValue,
} from "@/components/design-system/FormSelectControl";
import { Skeleton } from "@/components/design-system/Skeleton";

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

  // Fetch available PMs
  const { data: pmsData, isLoading: isLoadingPms } = useSearchUsersQuery(
    { role: UserRole.PM, limit: 100 },
    { skip: !open }
  );

  const availablePms = (pmsData?.items ?? []).filter((pm) => pm.id !== currentPmId);

  // Reset form when dialog opens
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
      toast.error("السبب مطلوب", { description: "يجب أن يكون السبب 10 أحرف على الأقل" });
      return;
    }

    try {
      await changePm({
        id: disputeId,
        input: {
          newPmId,
          reason: reason.trim(),
        },
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="تغيير مدير المشروع"
      description={`التذكرة: ${disputeTitle}`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isChanging}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isChanging || !newPmId || reason.trim().length < 10}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isChanging ? "جارٍ..." : (
              <>
                <ArrowRightLeft className="h-4 w-4 ml-2" />
                تغيير المدير
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4" dir="rtl">
        {/* Current Info */}
        <div className="p-3 bg-neutral-50 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-portal-note-text">المدير الحالي:</span>
            <span className="text-sm font-medium text-natural-100">{currentPmName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-portal-note-text">المشروع:</span>
            <span className="text-sm font-medium text-natural-100">{projectName}</span>
          </div>
        </div>

        {/* New PM Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-natural-100">
            المدير الجديد <span className="text-red-500">*</span>
          </label>
          {isLoadingPms ? (
            <Skeleton className="h-10 w-full rounded-xl" />
          ) : availablePms.length === 0 ? (
            <p className="text-sm text-red-600">لا يوجد مديرون آخرون متاحون</p>
          ) : (
            <FormSelect value={newPmId} onValueChange={setNewPmId}>
              <FormSelectTrigger className="w-full">
                <FormSelectValue placeholder="اختر المدير الجديد" />
              </FormSelectTrigger>
              <FormSelectContent>
                {availablePms.map((pm) => (
                  <FormSelectItem key={pm.id} value={pm.id}>
                    {pm.name}
                  </FormSelectItem>
                ))}
              </FormSelectContent>
            </FormSelect>
          )}
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-natural-100">
            سبب التغيير <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full min-h-[100px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-secondary-500 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 resize-none"
            placeholder="اشرح سبب تغيير المدير..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            dir="rtl"
          />
          <p className="text-xs text-portal-note-text">
            {reason.trim().length}/10 أحرف على الأقل
          </p>
        </div>

        {/* Warning */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">تنبيه</p>
            <ul className="list-disc list-inside space-y-1">
              <li>سيتم نقل جميع مهام المشروع للمدير الجديد</li>
              <li>سيتم إشعار العميل والمديرين القديم والجديد</li>
              <li>سيتم إغلاق التذكرة بعد التغيير</li>
            </ul>
          </div>
        </div>
      </div>
    </Dialog>
  );
}