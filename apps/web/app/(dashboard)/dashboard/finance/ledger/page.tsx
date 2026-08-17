import { ScrollText } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinanceLedgerPage() {
  return (
    <FinancePagePlaceholder
      title="سجل التدقيق"
      description="سجل العمليات المالية والتغييرات."
      icon={ScrollText}
    />
  );
}