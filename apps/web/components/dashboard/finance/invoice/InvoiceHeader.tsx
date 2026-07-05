"use client";

import { useState } from "react";
import {
  Hash,
  Copy,
  CheckCheck,
  Calendar,
  CreditCard,
  User,
} from "lucide-react";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { getDaysRemaining, formatDateTz } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Invoice } from "@hassad/shared";

interface InvoiceHeaderProps {
  invoice: Invoice;
}

const STATUS_ACCENT: Record<string, string> = {
  PAID: "bg-success-500",
  PARTIAL: "bg-alert-500",
  LATE: "bg-danger-500",
  SENT: "bg-indigo-500",
  PENDING: "bg-secondary-500",
  DUE: "bg-secondary-500",
  CANCELLED: "bg-neutral-400",
};

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

export function InvoiceHeader({ invoice }: InvoiceHeaderProps) {
  const [copied, setCopied] = useState(false);
  const daysRemaining = getDaysRemaining(invoice.dueDate);
  const isOverdue =
    invoice.status === "LATE" ||
    (invoice.status !== "PAID" &&
      invoice.status !== "CANCELLED" &&
      daysRemaining < 0);
  const isPaid = invoice.status === "PAID";
  const accentColor = STATUS_ACCENT[invoice.status] || "bg-secondary-500";

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(invoice.invoiceNumber);
    setCopied(true);
    toast.success("تم نسخ رقم الفاتورة");
    setTimeout(() => setCopied(false), 2000);
  };

  const methodLabel =
    PAYMENT_METHOD_LABELS[invoice.paymentMethod] || invoice.paymentMethod;

  return (
    <div>
      {/* Accent bar */}
      <div className={cn("h-2 w-full", accentColor)} />

      <div className="p-6 space-y-5">
        {/* Top row: number + status */}
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-portal-note-text" />
              <h2 className="text-2xl font-mono font-bold text-natural-100">
                {invoice.invoiceNumber}
              </h2>
              <ActionButton
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0 transition-all",
                  copied ? "text-success-500" : "hover:bg-secondary-50",
                )}
                onClick={handleCopyNumber}
                title="نسخ الرقم"
              >
                {copied ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-portal-note-text" />
                )}
              </ActionButton>
            </div>
            <p className="text-sm text-portal-note-text">
              أُنشئت بتاريخ: {formatDateTz(invoice.createdAt)}
            </p>
          </div>
          <FinanceStatusBadge
            status={invoice.status}
            className="text-base px-4 py-1.5 shrink-0"
          />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Due date with days indicator */}
          <div className="rounded-xl border border-portal-card-border bg-portal-bg p-3">
            <p className="text-xs text-portal-note-text mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              تاريخ الاستحقاق
            </p>
            <p className="text-sm font-bold text-natural-100">
              {formatDateTz(invoice.dueDate)}
            </p>
            {!isPaid && invoice.status !== "CANCELLED" && (
              <span
                className={cn(
                  "inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  isOverdue
                    ? "bg-danger-100 text-danger-600"
                    : daysRemaining <= 7
                      ? "bg-alert-100 text-alert-700"
                      : "bg-success-100 text-success-600",
                )}
              >
                {isOverdue
                  ? `متأخرة ${Math.abs(daysRemaining)} يوم`
                  : `متبقي ${daysRemaining} يوم`}
              </span>
            )}
            {isPaid && (
              <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-success-100 text-success-600">
                تم الدفع
              </span>
            )}
          </div>

          {/* Total amount */}
          <div className="rounded-xl border border-portal-card-border bg-portal-bg p-3">
            <p className="text-xs text-portal-note-text mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              القيمة
            </p>
            <p className="text-lg font-bold text-natural-100">
              <CurrencyDisplay amount={invoice.amount} />
            </p>
          </div>

          {/* Payment method */}
          <div className="rounded-xl border border-portal-card-border bg-portal-bg p-3">
            <p className="text-xs text-portal-note-text mb-1">طريقة الدفع</p>
            <p className="text-sm font-bold text-natural-100">{methodLabel}</p>
          </div>

          {/* Created by */}
          <div className="rounded-xl border border-portal-card-border bg-portal-bg p-3">
            <p className="text-xs text-portal-note-text mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              المنشئ
            </p>
            <p className="text-sm font-bold text-natural-100">
              {(invoice as any).creator?.name || "النظام"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
