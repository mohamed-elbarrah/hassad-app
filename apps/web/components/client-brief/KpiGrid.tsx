"use client";

import { BriefCard } from "./BriefCard";
import { ClientBriefStatCard } from "./ClientBriefStatCard";
import { CurrencySymbol } from "@/components/design-system/CurrencySymbol";
import { KPI_VISIBILITY, type KpiKey } from "./profile-visibility";
import type { KpiViewModel } from "./useClientBrief";
import { UserRole } from "@hassad/shared";
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
  role: UserRole;
}

/** Map each KpiKey to its render function */
const KPI_RENDERERS: Record<KpiKey, (kpis: KpiViewModel) => React.ReactNode> = {
  totalProjects: (kpis) => (
    <ClientBriefStatCard
      key="totalProjects"
      icon={Briefcase}
      label="إجمالي المشاريع"
      value={kpis.totalProjects}
      tone="secondary"
    />
  ),
  activeProjects: (kpis) => (
    <ClientBriefStatCard
      key="activeProjects"
      icon={TrendingUp}
      label="المشاريع النشطة"
      value={kpis.activeProjects}
      tone="success"
    />
  ),
  completedProjects: (kpis) => (
    <ClientBriefStatCard
      key="completedProjects"
      icon={CheckCircle2}
      label="المشاريع المكتملة"
      value={kpis.completedProjects}
      tone="action-blue"
    />
  ),
  cancelledProjects: (kpis) => (
    <ClientBriefStatCard
      key="cancelledProjects"
      icon={XCircle}
      label="المشاريع الملغية"
      value={kpis.cancelledProjects}
      tone="danger"
    />
  ),
  contractValue: (kpis) => (
    <ClientBriefStatCard
      key="contractValue"
      icon={DollarSign}
      label="قيمة العقود"
      value={
        <>
          {kpis.contractValue} <CurrencySymbol className="inline-block" />
        </>
      }
      tone="primary"
    />
  ),
  totalPaid: (kpis) => (
    <ClientBriefStatCard
      key="totalPaid"
      icon={CreditCard}
      label="إجمالي المدفوع"
      value={
        <>
          {kpis.totalPaid} <CurrencySymbol className="inline-block" />
        </>
      }
      tone="action-purple"
    />
  ),
};

export function KpiGrid({ kpis, role }: KpiGridProps) {
  const visibleKpis = KPI_VISIBILITY[role] ?? KPI_VISIBILITY[UserRole.ADMIN];

  if (visibleKpis.length === 0) return null;

  return (
    <BriefCard
      title="إحصائيات العميل"
      description="بيانات النظام"
      icon={Briefcase}
    >
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleKpis.map((key) => KPI_RENDERERS[key](kpis))}
      </div>
    </BriefCard>
  );
}
