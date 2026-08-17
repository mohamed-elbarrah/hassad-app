"use client";

import { Wallet } from "lucide-react";
import type { PortalFinanceSummary } from "@/features/portal/portalApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatShortDateLong } from "@/lib/format";

export function FinanceSummaryKpis({ data, isLoading }: { data: PortalFinanceSummary | undefined; isLoading: boolean }) {
  if (isLoading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>;
  const summary = data ?? { totalInvoiced: 0, totalPaid: 0, totalRemaining: 0, nextInvoiceDueDate: null, nextInvoiceAmount: 0 };
  const items = [{ label: "إجمالي المفوتر", value: formatCurrency(summary.totalInvoiced) }, { label: "المستحقات عليك", value: formatCurrency(summary.totalRemaining) }, { label: "إجمالي المدفوع", value: formatCurrency(summary.totalPaid) }, { label: "الفاتورة القادمة", value: summary.nextInvoiceDueDate ? formatShortDateLong(summary.nextInvoiceDueDate) : formatCurrency(summary.nextInvoiceAmount) }];
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item, index) => <Card key={item.label}><CardContent className="flex items-center gap-3 pt-6">{index === 1 ? <Wallet className="size-5 text-muted-foreground" /> : null}<div><p className="text-sm text-muted-foreground">{item.label}</p><p className="text-lg font-semibold">{item.value}</p></div></CardContent></Card>)}</div>;
}
