"use client";

import { useState } from "react";
import {
  Plus,
  Bell,
  CheckCircle2,
  Send,
  Copy,
  Printer,
  Download,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { useSendInvoiceMutation, useSendInvoiceReminderMutation } from "@/features/finance/financeApi";
import { RegisterPaymentModal } from "./modals/RegisterPaymentModal";
import { SendInvoiceModal } from "./modals/SendInvoiceModal";
import { UpdateStatusModal } from "./modals/UpdateStatusModal";
import { toast } from "sonner";
import type { Invoice } from "@hassad/shared";

interface InvoiceActionsProps {
  invoice: Invoice;
  remainingAmount: number;
  onActionComplete?: () => void;
}

export function InvoiceActions({
  invoice,
  remainingAmount,
  onActionComplete,
}: InvoiceActionsProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [sendReminder, { isLoading: isSendingReminder }] =
    useSendInvoiceReminderMutation();

  const isCancelled = invoice.status === "CANCELLED";
  const isPaid = invoice.status === "PAID";

  const handleSendReminder = async () => {
    try {
      await sendReminder(invoice.id).unwrap();
      toast.success("تم إرسال التذكير للعميل");
      onActionComplete?.();
    } catch {
      toast.error("فشل إرسال التذكير");
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/dashboard/finance/invoices/${invoice.id}`;
    navigator.clipboard.writeText(link);
    toast.success("تم نسخ رابط الفاتورة");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    toast.info("سيتم توفير تحميل PDF قريباً");
  };

  return (
    <>
      <SurfaceCard className="border-none shadow-sm">
        <div className="p-4 space-y-2">
          <ActionButton
            variant="primary"
            className="w-full justify-center"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowPaymentModal(true)}
            disabled={isCancelled || isPaid || remainingAmount <= 0}
          >
            تسجيل دفعة جديدة
          </ActionButton>

          <ActionButton
            variant="outline"
            className="w-full justify-center"
            icon={<Send className="w-4 h-4" />}
            onClick={() => setShowSendModal(true)}
            disabled={isCancelled || isPaid}
          >
            إرسال الفاتورة
          </ActionButton>

          <ActionButton
            variant="outline"
            className="w-full justify-center"
            icon={<Bell className="w-4 h-4" />}
            onClick={handleSendReminder}
            loading={isSendingReminder}
            disabled={isCancelled || isPaid}
          >
            إرسال تذكير
          </ActionButton>

          <ActionButton
            variant="outline"
            className="w-full justify-center"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={() => setShowStatusModal(true)}
            disabled={isCancelled}
          >
            تحديث الحالة
          </ActionButton>

          <ActionButton
            variant="outline"
            className="w-full justify-center"
            icon={<Copy className="w-4 h-4" />}
            onClick={handleCopyLink}
          >
            نسخ رابط الفاتورة
          </ActionButton>

          <ActionButton
            variant="outline"
            className="w-full justify-center"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            طباعة
          </ActionButton>

          <ActionButton
            variant="outline"
            className="w-full justify-center"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadPdf}
          >
            تحميل PDF
          </ActionButton>
        </div>
      </SurfaceCard>

      {/* Modals */}
      <RegisterPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        invoiceId={invoice.id}
        maxAmount={remainingAmount}
        onSuccess={onActionComplete}
      />

      <SendInvoiceModal
        open={showSendModal}
        onOpenChange={setShowSendModal}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        onSuccess={onActionComplete}
      />

      <UpdateStatusModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        invoiceId={invoice.id}
        currentStatus={invoice.status}
        onSuccess={onActionComplete}
      />
    </>
  );
}
