import { FileText } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinanceContractDetailPage() {
  return (
    <FinancePagePlaceholder
      title="تفاصيل العقد"
      description="الحالة المالية التفصيلية لعقد محدد."
      icon={FileText}
    />
  );
}