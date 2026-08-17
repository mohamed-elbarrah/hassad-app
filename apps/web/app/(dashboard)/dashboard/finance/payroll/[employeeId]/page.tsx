import { User } from "lucide-react";

import { FinancePagePlaceholder } from "@/components/dashboard/finance/finance-page-placeholder";

export default function FinanceEmployeeSalaryPage() {
  return (
    <FinancePagePlaceholder
      title="راتب الموظف"
      description="تفاصيل راتب موظف محدد وتاريخه."
      icon={User}
    />
  );
}