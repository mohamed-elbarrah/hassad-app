import { Banknote } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinancePayrollPage() {
  return (
    <FinancePagePlaceholder
      title="الرواتب والأجور"
      description="إدارة رواتب الموظفين والأجور الشهرية."
      icon={Banknote}
    />
  );
}