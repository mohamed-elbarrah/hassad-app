import { Users } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinanceClientsPage() {
  return (
    <FinancePagePlaceholder
      title="العملاء"
      description="قائمة العملاء ومتابعة حساباتهم المالية."
      icon={Users}
    />
  );
}