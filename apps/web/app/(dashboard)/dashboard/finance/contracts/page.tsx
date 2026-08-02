import { Handshake } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinanceContractsPage() {
  return (
    <FinancePagePlaceholder
      title="العقود"
      description="متابعة الحالة المالية للعقود والتحصيلات."
      icon={Handshake}
    />
  );
}