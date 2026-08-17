import { LayoutDashboard } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinanceOverviewPage() {
  return (
    <FinancePagePlaceholder
      title="لوحة التحكم المالية"
      description="نظرة عامة على الأداء المالي للشركة."
      icon={LayoutDashboard}
    />
  );
}