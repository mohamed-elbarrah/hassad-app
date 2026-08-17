import { FileBarChart } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinanceInvoiceDetailPage() {
  return (
    <FinancePagePlaceholder
      title="تفاصيل الفاتورة"
      description="تفاصيل فاتورة محددة وسجل مدفوعاتها."
      icon={FileBarChart}
    />
  );
}