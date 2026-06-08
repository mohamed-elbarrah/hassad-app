"use client";

import { useGetFinanceContractsQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Search,
  TrendingUp,
  DollarSign,
  PieChart,
  Loader2,
} from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import Link from "next/link";

export default function ContractsFinancePage() {
  const { data: contracts = [], isLoading } = useGetFinanceContractsQuery();

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  const totalValue = contracts.reduce((sum, c) => sum + c.totalValue, 0);
  const totalPaid = contracts.reduce((sum, c) => sum + c.paid, 0);
  const totalRemaining = totalValue - totalPaid;
  const averageCollectionRate =
    totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          الوضع المالي للعقود
        </h1>
        <p className="text-neutral-300">
          متابعة تحصيل الدفعات مقارنة بالقيمة الإجمالية للعقود.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div>
            <p className="text-portal-note-text text-sm">إجمالي قيمة العقود</p>
            <h3 className="text-2xl font-bold mt-1">
              {totalValue.toLocaleString()} ر.س
            </h3>
          </div>
          <div className="flex items-center text-xs text-neutral-300 mt-3">
            <TrendingUp className="w-3 h-3 ml-1 text-success-500" />
            <span>+5% عن الشهر الماضي</span>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div>
            <p className="text-portal-note-text text-sm">المبالغ المحصلة</p>
            <h3 className="text-2xl font-bold text-success-600 mt-1">
              {totalPaid.toLocaleString()} ر.س
            </h3>
          </div>
          <div className="mt-3 space-y-1">
            <ProgressBar value={averageCollectionRate} size="sm" />
            <p className="text-[10px] text-neutral-300">
              {averageCollectionRate.toFixed(1)}% من إجمالي القيمة
            </p>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div>
            <p className="text-portal-note-text text-sm">المبالغ المتبقية</p>
            <h3 className="text-2xl font-bold text-danger-600 mt-1">
              {totalRemaining.toLocaleString()} ر.س
            </h3>
          </div>
          <div className="flex items-center text-xs text-neutral-300 mt-3">
            <DollarSign className="w-3 h-3 ml-1" />
            <span>بانتظار الفواتير القادمة</span>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div>
            <p className="text-portal-note-text text-sm">عقود نشطة</p>
            <h3 className="text-2xl font-bold mt-1">{contracts.length} عقد</h3>
          </div>
          <div className="flex items-center text-xs text-neutral-300 mt-3">
            <PieChart className="w-3 h-3 ml-1 text-action-blue" />
            <span>إجمالي العقود المسجلة</span>
          </div>
        </SurfaceCard>
      </div>

      <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm">
        <div className="px-5 py-4 border-b border-portal-divider">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
            <FormInputControl
              placeholder="البحث عن عقد أو عميل..."
              className="pr-10"
            />
          </div>
        </div>
        <div className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العقد</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>القيمة الإجمالية</TableHead>
                <TableHead>المحصل</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>نسبة التحصيل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    <div>{contract.title}</div>
                    <div className="text-[10px] text-neutral-300 font-mono">
                      {contract.id.substring(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell>{contract.client?.companyName || "N/A"}</TableCell>
                  <TableCell className="font-bold">
                    {contract.totalValue.toLocaleString()} ر.س
                  </TableCell>
                  <TableCell className="text-success-600 font-medium">
                    {contract.paid.toLocaleString()} ر.س
                  </TableCell>
                  <TableCell className="text-danger-600 font-medium">
                    {contract.remaining.toLocaleString()} ر.س
                  </TableCell>
                  <TableCell className="w-[150px]">
                    <div className="space-y-1">
                      <ProgressBar value={contract.collectionRate} size="sm" />
                      <span className="text-[10px] text-neutral-300">
                        {contract.collectionRate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <FinanceStatusBadge status={contract.status} />
                  </TableCell>
                  <TableCell className="text-left">
                    <Link href={`/dashboard/finance/contracts/${contract.id}`}>
                      <ActionButton variant="ghost" size="sm">
                        التفاصيل
                      </ActionButton>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {contracts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-neutral-300"
                  >
                    لا توجد عقود مسجلة.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
