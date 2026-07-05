"use client";

import { useState } from "react";
import { Plus, CreditCard, ImageIcon, X } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { formatDateTz } from "@/lib/format";

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  date: string | Date;
  notes?: string | null;
  receiptImage?: string | null;
}

interface InvoicePaymentHistoryProps {
  payments: Payment[];
  invoiceId: string;
  remainingAmount: number;
  isLoading?: boolean;
  onAddPayment: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "تحويل بنكي",
  CASH: "نقدي",
  CARD: "بطاقة",
  MADA: "مدى",
  VISA_MC: "Visa/Mastercard",
  APPLE_PAY: "Apple Pay",
  TABBY: "تابي",
  TAMARA: "تمارا",
};

function ReceiptPreview({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-secondary-500 hover:underline"
      >
        عرض الإيصال
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="إيصال الدفع"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export function InvoicePaymentHistory({
  payments,
  remainingAmount,
  isLoading = false,
  onAddPayment,
}: InvoicePaymentHistoryProps) {
  const methodLabel = (method: string) =>
    PAYMENT_METHOD_LABELS[method] || method;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-natural-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-portal-icon" />
          المدفوعات
          <span className="text-xs text-portal-note-text font-normal">
            ({payments.length})
          </span>
        </h3>
        <ActionButton
          variant="outline"
          size="sm"
          icon={<Plus className="w-3 h-3" />}
          onClick={onAddPayment}
          disabled={remainingAmount <= 0}
        >
          إضافة دفعة
        </ActionButton>
      </div>

      <DataTable
        columns={[
          { id: "id", label: "رقم العملية" },
          { id: "amount", label: "المبلغ" },
          { id: "method", label: "طريقة الدفع" },
          { id: "status", label: "الحالة" },
          { id: "date", label: "التاريخ", align: "left" },
          { id: "receipt", label: "الإيصال", align: "center" },
        ]}
        data={payments}
        isLoading={isLoading}
        isError={false}
        emptyState={{
          icon: CreditCard,
          message: "لا توجد مدفوعات مسجلة",
          hint: "قم بتسجيل دفعة جديدة للفاتورة.",
        }}
        renderCells={(p) => [
          <td key="id" className="px-4 py-3 align-middle">
            <span
              className="font-mono text-[10px] text-portal-note-text cursor-pointer hover:text-secondary-500"
              onClick={() => navigator.clipboard.writeText(p.id)}
              title="انسخ رقم العملية"
            >
              {p.id.substring(0, 8)}...
            </span>
          </td>,
          <td key="amount" className="px-4 py-3 align-middle">
            <span className="font-bold text-natural-100 font-mono text-sm">
              <CurrencyDisplay amount={p.amount} />
            </span>
          </td>,
          <td key="method" className="px-4 py-3 align-middle">
            <span className="text-sm text-natural-100">
              {methodLabel(p.method)}
            </span>
          </td>,
          <td key="status" className="px-4 py-3 align-middle">
            <FinanceStatusBadge status={p.status} />
          </td>,
          <td key="date" className="px-4 py-3 align-middle text-start">
            <span className="text-xs text-portal-note-text">
              {formatDateTz(p.date)}
            </span>
          </td>,
          <td key="receipt" className="px-4 py-3 align-middle text-center">
            {p.receiptImage ? (
              <ReceiptPreview url={p.receiptImage} />
            ) : (
              <span className="text-xs text-portal-note-text">—</span>
            )}
          </td>,
        ]}
      />
    </div>
  );
}
