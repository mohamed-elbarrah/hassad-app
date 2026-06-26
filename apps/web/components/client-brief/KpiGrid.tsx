"use client";

import { BriefCard } from "./BriefCard";
import { ClientBriefStatCard } from "./ClientBriefStatCard";
import { CurrencySymbol } from "@/components/design-system/CurrencySymbol";
import type { KpiViewModel } from "./useClientBrief";
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  XCircle,
  DollarSign,
  CreditCard,
} from "lucide-react";

interface KpiGridProps {
  kpis: KpiViewModel;
}

export function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <BriefCard
      title="إحصائيات العميل"
      description="بيانات النظام"
      icon={Briefcase}
    >
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <ClientBriefStatCard
          icon={Briefcase}
          label="إجمالي المشاريع"
          value={kpis.totalProjects}
          tone="secondary"
        />
        <ClientBriefStatCard
          icon={TrendingUp}
          label="المشاريع النشطة"
          value={kpis.activeProjects}
          tone="success"
        />
        <ClientBriefStatCard
          icon={CheckCircle2}
          label="المشاريع المكتملة"
          value={kpis.completedProjects}
          tone="action-blue"
        />
        <ClientBriefStatCard
          icon={XCircle}
          label="المشاريع الملغية"
          value={kpis.cancelledProjects}
          tone="danger"
        />
        <ClientBriefStatCard
          icon={DollarSign}
          label="قيمة العقود"
          value={
            <>
              {kpis.contractValue} <CurrencySymbol className="inline-block" />
            </>
          }
          tone="primary"
        />
        <ClientBriefStatCard
          icon={CreditCard}
          label="إجمالي المدفوع"
          value={
            <>
              {kpis.totalPaid} <CurrencySymbol className="inline-block" />
            </>
          }
          tone="action-purple"
        />
      </div>
    </BriefCard>
  );
}
