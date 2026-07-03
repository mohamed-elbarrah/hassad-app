"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { useUpdateInvoiceMutation } from "@/features/finance/financeApi";
import { toast } from "sonner";
import type { InvoiceStatus } from "@hassad/shared";

interface UpdateStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  currentStatus: string;
  onSuccess?: () => void;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  DUE: ["SENT", "CANCELLED"],
  SENT: ["PARTIAL", "PAID", "CANCELLED"],
  PARTIAL: ["PAID", "CANCELLED"],
  LATE: ["PAID", "CANCELLED"],
  PENDING: ["SENT", "CANCELLED"],
  PAID: [],
  CANCELLED: [],
};

const STATUS_LABELS: Record<string, string> = {
  DUE: "مستحق",
  SENT: "تم الإرسال",
  PARTIAL: "مدفوع جزئياً",
  PAID: "مدفوع",
  LATE: "متأخر",
  PENDING: "قيد الانتظار",
  CANCELLED: "ملغي",
};

export function UpdateStatusModal({
  open,
  onOpenChange,
  invoiceId,
  currentStatus,
  onSuccess,
}: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updateInvoice, { isLoading }] = useUpdateInvoiceMutation();

  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

  const handleUpdate = async () => {
    if (!selectedStatus) {
      toast.error("يرجى اختيار الحالة الجديدة");
      return;
    }

    try {
      await updateInvoice({
        id: invoiceId,
        status: selectedStatus as InvoiceStatus,
      }).unwrap();
      toast.success(`تم تحديث الحالة إلى ${STATUS_LABELS[selectedStatus] || selectedStatus}`);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("فشل تحديث الحالة");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تحديث حالة الفاتورة</DialogTitle>
          <DialogDescription>
            الحالة الحالية: {STATUS_LABELS[currentStatus] || currentStatus}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {allowedTransitions.length === 0 ? (
            <p className="text-sm text-portal-note-text text-center">
              لا يمكن تغيير حالة فاتورة {STATUS_LABELS[currentStatus] || currentStatus}
            </p>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-natural-100">
                الحالة الجديدة
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allowedTransitions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedStatus === status
                        ? "border-secondary-500 bg-secondary-500/10 text-secondary-500"
                        : "border-portal-card-border bg-natural-0 text-natural-100 hover:border-secondary-500/50"
                    }`}
                  >
                    {STATUS_LABELS[status] || status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <ActionButton variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </ActionButton>
          {allowedTransitions.length > 0 && (
            <ActionButton
              variant="primary"
              onClick={handleUpdate}
              loading={isLoading}
              disabled={!selectedStatus}
            >
              تحديث الحالة
            </ActionButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
