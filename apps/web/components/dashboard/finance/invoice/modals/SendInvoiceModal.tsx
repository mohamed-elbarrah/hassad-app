"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/design-system/Primitives";
import { ActionButton } from "@/components/design-system/ActionButton";
import { useSendInvoiceMutation } from "@/features/finance/financeApi";
import { toast } from "sonner";

interface SendInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  onSuccess?: () => void;
}

export function SendInvoiceModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  onSuccess,
}: SendInvoiceModalProps) {
  const [sendInvoice, { isLoading }] = useSendInvoiceMutation();

  const handleSend = async () => {
    try {
      await sendInvoice(invoiceId).unwrap();
      toast.success(`تم إرسال الفاتورة ${invoiceNumber} للعميل`);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("فشل إرسال الفاتورة");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>إرسال الفاتورة</DialogTitle>
          <DialogDescription>
            سيتم إرسال الفاتورة {invoiceNumber} إلى العميل للإطلاع والدفع.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 justify-end pt-4">
          <ActionButton variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={handleSend}
            loading={isLoading}
          >
            تأكيد الإرسال
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
