"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { BriefCard } from "./BriefCard";
import { ClientBriefStatCard } from "./ClientBriefStatCard";
import { ClientBriefBarChart } from "./ClientBriefBarChart";
import { ClientBriefField } from "./ClientBriefField";
import { formatCurrency } from "@/lib/format";
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  XCircle,
  DollarSign,
  CreditCard,
  Star,
  Building2,
  Target,
  Globe,
  Banknote,
  MessageCircle,
  Languages,
  Clock,
} from "lucide-react";

interface ClientBriefOverviewProps {
  client: Client;
  profile: ClientProfile | null;
}

const COMM_PREF_LABELS: Record<string, string> = {
  email: "بريد إلكتروني",
  whatsapp: "واتساب",
  phone: "هاتف",
  chat: "محادثة",
};

export function ClientBriefOverview({
  client,
  profile,
}: ClientBriefOverviewProps) {
  const totalProjects =
    (client.activeProjects ?? 0) +
    (client.completedProjects ?? 0) +
    (client.cancelledProjects ?? 0);

  const financialData = [
    {
      name: "المالية",
      contracts: client.totalContractValue ?? 0,
      paid: client.totalPaid ?? 0,
    },
  ];

  const projectData = [
    {
      name: "المشاريع",
      active: client.activeProjects ?? 0,
      completed: client.completedProjects ?? 0,
      cancelled: client.cancelledProjects ?? 0,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Key metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <ClientBriefStatCard
          icon={Briefcase}
          label="إجمالي المشاريع"
          value={totalProjects}
          colorClass="text-secondary-500"
        />
        <ClientBriefStatCard
          icon={TrendingUp}
          label="المشاريع النشطة"
          value={client.activeProjects ?? 0}
          colorClass="text-success-500"
        />
        <ClientBriefStatCard
          icon={CheckCircle2}
          label="المشاريع المكتملة"
          value={client.completedProjects ?? 0}
          colorClass="text-action-blue"
        />
        <ClientBriefStatCard
          icon={XCircle}
          label="المشاريع الملغية"
          value={client.cancelledProjects ?? 0}
          colorClass="text-danger-500"
        />
        <ClientBriefStatCard
          icon={DollarSign}
          label="قيمة العقود"
          value={formatCurrency(client.totalContractValue)}
          colorClass="text-primary-500"
        />
        <ClientBriefStatCard
          icon={CreditCard}
          label="إجمالي المدفوع"
          value={formatCurrency(client.totalPaid)}
          colorClass="text-action-purple"
        />
      </div>

      {/* Financial chart */}
      <BriefCard
        title="نظرة مالية"
        description="قيمة العقود مقابل المدفوع"
        icon={DollarSign}
      >
        <ClientBriefBarChart
          data={financialData}
          series={[
            { key: "contracts", name: "قيمة العقود", color: "#121936" },
            { key: "paid", name: "المدفوع", color: "#E7BE52" },
          ]}
          valueType="currency"
          showLegend={true}
        />
      </BriefCard>

      {/* Projects chart */}
      <BriefCard
        title="توزيع المشاريع"
        description="حالة المشاريع حسب النشاط"
        icon={Briefcase}
      >
        <ClientBriefBarChart
          data={projectData}
          series={[
            { key: "active", name: "نشط", color: "#0ED589" },
            { key: "completed", name: "مكتمل", color: "#2684FC" },
            { key: "cancelled", name: "ملغى", color: "#EF4444" },
          ]}
          valueType="number"
          showLegend={true}
        />
      </BriefCard>

      {/* Business info + preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BriefCard
          title="معلومات النشاط"
          description="تفاصيل النشاط التجاري"
          icon={Building2}
        >
          <div className="space-y-3">
            <ClientBriefField
              icon={Building2}
              label="المجال / القطاع"
              value={profile?.industry}
            />
            <ClientBriefField
              icon={Target}
              label="الجمهور المستهدف"
              value={profile?.targetAudience}
            />
            <ClientBriefField
              icon={Banknote}
              label="نطاق الميزانية"
              value={
                profile?.budgetRangeMin != null ||
                profile?.budgetRangeMax != null
                  ? `${
                      profile?.budgetRangeMin != null
                        ? formatCurrency(profile.budgetRangeMin)
                        : "—"
                    } — ${
                      profile?.budgetRangeMax != null
                        ? formatCurrency(profile.budgetRangeMax)
                        : "—"
                    }`
                  : null
              }
            />
            <ClientBriefField
              icon={Globe}
              label="المنصات المفضلة"
              value={profile?.preferredPlatforms}
            />
          </div>
          {profile?.businessDescription && (
            <div className="mt-4 pt-4 border-t border-portal-divider">
              <p className="text-xs text-neutral-300 font-medium mb-1">
                وصف النشاط
              </p>
              <p className="text-sm text-natural-100 leading-relaxed">
                {profile.businessDescription}
              </p>
            </div>
          )}
        </BriefCard>

        <BriefCard
          title="تفضيلات التواصل"
          description="كيف يفضل العميل التعامل"
          icon={MessageCircle}
        >
          <div className="space-y-3">
            <ClientBriefField
              icon={MessageCircle}
              label="وسيلة التواصل المفضلة"
              value={
                profile?.communicationPreference
                  ? (COMM_PREF_LABELS[profile.communicationPreference] ??
                    profile.communicationPreference)
                  : null
              }
            />
            <ClientBriefField
              icon={Languages}
              label="اللغة المفضلة"
              value={profile?.preferredLanguage}
            />
            <ClientBriefField
              icon={Clock}
              label="المنطقة الزمنية"
              value={profile?.timezone}
            />
            <ClientBriefField
              icon={Star}
              label="متوسط التقييم"
              value={
                client.avgSatisfactionScore != null
                  ? `${client.avgSatisfactionScore}/5`
                  : null
              }
            />
          </div>
        </BriefCard>
      </div>
    </div>
  );
}
