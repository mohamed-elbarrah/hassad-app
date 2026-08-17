import { WalletCards } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinanceClientProfilePage() {
  return (
    <FinancePagePlaceholder
      title="الملف المالي للعميل"
      description="الحساب المالي التفصيلي لعميل محدد."
      icon={WalletCards}
    />
  );
}