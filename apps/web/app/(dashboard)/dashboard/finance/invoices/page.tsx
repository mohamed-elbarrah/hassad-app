import { Receipt } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinanceInvoicesPage() {
  return (
    <FinancePagePlaceholder
      title="الفواتير"
      description="إدارة جميع الفواتير وتتبع حالاتها."
      icon={Receipt}
    />
  );
}