"use client";

import { useGetFinanceContractsQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { FinancePageHeader } from "@/components/dashboard/finance/shared/FinancePageHeader";
import { DataTable } from "@/components/design-system/DataTable";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { StatCard } from "@/components/design-system/StatCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function ContractsFinancePage() {
  const { data: contracts = [], isLoading } = useGetFinanceContractsQuery();

  const totalValue = contracts.reduce((sum, c) => sum + c.totalValue, 0);
  const totalPaid = contracts.reduce((sum, c) => sum + c.paid, 0);
  const totalRemaining = totalValue - totalPaid;
  const averageCollectionRate =
    totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <FinancePageHeader
        title="الوضع المالي للعقود"
        description="متابعة تحصيل الدفعات مقارنة بالقيمة الإجمالية للعقود."
        icon={FileText}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="إجمالي قيمة العقود"
          value={<CurrencyDisplay amount={totalValue} />}
          icon={TrendingUp}
          variant="default"
          trend="up"
          trendValue="+5% عن الشهر الماضي"
        />
        <StatCard
          title="المبالغ المحصلة"
          value={<CurrencyDisplay amount={totalPaid} />}
          icon={DollarSign}
          variant="success"
          trend="neutral"
          trendValue={`${averageCollectionRate.toFixed(1)}% من الإجمالي`}
        />
        <StatCard
          title="المبالغ المتبقية"
          value={<CurrencyDisplay amount={totalRemaining} />}
          icon={DollarSign}
          variant="danger"
          trend="neutral"
          trendValue="بانتظار الفواتير القادمة"
        />
        <StatCard
          title="عقود نشطة"
          value={contracts.length}
          icon={PieChart}
          variant="default"
          trend="neutral"
          trendValue="إجمالي العقود المسجلة"
        />
      </div>

      <SurfaceCard className="border-none shadow-sm" contentClassName="p-0">
        <DataTable
          columns={[
            { id: "contract", label: "العقد" },
            { id: "client", label: "العميل" },
            { id: "value", label: "القيمة الإجمالية" },
            { id: "paid", label: "المحصل" },
            { id: "remaining", label: "المتبقي" },
            { id: "rate", label: "نسبة التحصيل", width: "150px" },
            { id: "status", label: "الحالة" },
            { id: "actions", label: "الإجراءات", align: "left" },
          ]}
          data={contracts}
          isLoading={isLoading}
          isError={false}
          emptyState={{
            icon: PieChart,
            message: "لا توجد عقود مسجلة",
            hint: "ستظهر العقود هنا بعد توقيعها.",
          }}
          renderRow={(contract) => (
            <tr className="border-b-[1.5px] border-portal-divider">
              <td className="px-5 py-4 font-medium">
                <div>{contract.title}</div>
                <div className="text-[10px] text-portal-note-text font-mono">
                  {contract.id.substring(0, 8)}...
                </div>
              </td>
              <td className="px-5 py-4">
                {contract.client?.companyName || "N/A"}
              </td>
              <td className="px-5 py-4 font-bold">
                <CurrencyDisplay amount={contract.totalValue} />
              </td>
              <td className="px-5 py-4 text-success-600 font-medium">
                <CurrencyDisplay amount={contract.paid} />
              </td>
              <td className="px-5 py-4 text-danger-600 font-medium">
                <CurrencyDisplay amount={contract.remaining} />
              </td>
              <td className="px-5 py-4">
                <div className="space-y-1">
                  <ProgressBar value={contract.collectionRate} size="sm" />
                  <span className="text-[10px] text-portal-note-text">
                    {contract.collectionRate.toFixed(1)}%
                  </span>
                </div>
              </td>
              <td className="px-5 py-4">
                <FinanceStatusBadge status={contract.status} />
              </td>
              <td className="px-5 py-4 text-left">
                <Link href={`/dashboard/finance/contracts/${contract.id}`}>
                  <ActionButton variant="ghost" size="sm">
                    التفاصيل
                  </ActionButton>
                </Link>
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
