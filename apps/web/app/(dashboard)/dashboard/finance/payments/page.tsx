import { CreditCard } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinancePaymentsPage() {
  return (
    <FinancePagePlaceholder
      title="المدفوعات"
      description="تتبع جميع المدفوعات الواردة والصادرة."
      icon={CreditCard}
    />
  );
}