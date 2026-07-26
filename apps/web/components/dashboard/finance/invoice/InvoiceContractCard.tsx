"use client";

import { FileSignature, ExternalLink } from "lucide-react";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import Link from "next/link";

interface ContractInvoiceSummary {
  amount: number;
  status: string;
  payments: { amount: number }[];
}

interface ContractData {
  id: string;
  title: string;
  type?: string;
  status: string;
  totalValue: number;
  invoices?: ContractInvoiceSummary[];
}

interface InvoiceContractCardProps {
  contract: ContractData | null | undefined;
}

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "اشتراك شهري",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

export function InvoiceContractCard({ contract }: InvoiceContractCardProps) {
  if (!contract) {
    return (
      <div className="rounded-xl border border-dashed border-portal-card-border bg-portal-bg p-4 text-center">
        <p className="text-sm text-portal-note-text">
          هذه الفاتورة غير مرتبطة بعقد
        </p>
      </div>
    );
  }

  const totalPaid =
    contract.invoices?.reduce((acc, inv) => {
      return acc + (inv.payments?.reduce((s, p) => s + p.amount, 0) ?? 0);
    }, 0) ?? 0;


  const collectionRate =
    contract.totalValue > 0
      ? Math.round((totalPaid / contract.totalValue) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-portal-card-border bg-natural-0 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-portal-icon" />
          <span className="text-sm font-medium text-natural-100">العقد</span>
        </div>
        <Link href={`/dashboard/finance/contracts/${contract.id}`}>
          <ExternalLink className="w-3.5 h-3.5 text-portal-icon hover:text-secondary-500 transition-colors" />
        </Link>
      </div>

      <div>
        <p className="text-sm font-bold text-natural-100 truncate">
          {contract.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {contract.type && (
            <span className="text-[10px] text-portal-note-text">
              {TYPE_LABELS[contract.type] || contract.type}
            </span>
          )}
          <FinanceStatusBadge status={contract.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-portal-card-border bg-portal-bg p-2.5">
          <p className="text-[10px] text-portal-note-text">قيمة العقد</p>
          <p className="text-sm font-bold text-natural-100">
            <CurrencyDisplay amount={contract.totalValue} />
          </p>
        </div>
        <div className="rounded-lg border border-portal-card-border bg-portal-bg p-2.5">
          <p className="text-[10px] text-portal-note-text">المدفوع</p>
          <p className="text-sm font-bold text-success-600">
            <CurrencyDisplay amount={totalPaid} />
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-portal-note-text">نسبة التحصيل</span>
          <span className="font-medium">{collectionRate}%</span>
        </div>
        <ProgressBar value={collectionRate} size="sm" />
      </div>
    </div>
  );
}
