"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  CreditCard,
  Star,
  Building2,
  Target,
  Globe,
  Banknote,
  Calendar,
} from "lucide-react";

interface OverviewTabProps {
  client: Client;
  profile: ClientProfile | null;
}

function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  colorClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-neutral-300">
          {label}
        </CardTitle>
        <Icon className={`h-4 w-4 ${colorClass ?? "text-neutral-300"}`} />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function OverviewTab({ client, profile }: OverviewTabProps) {
  const totalProjects =
    (client.activeProjects ?? 0) +
    (client.completedProjects ?? 0) +
    (client.cancelledProjects ?? 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase}
          label="إجمالي المشاريع"
          value={totalProjects}
        />
        <StatCard
          icon={TrendingUp}
          label="المشاريع النشطة"
          value={client.activeProjects ?? 0}
          colorClass="text-green-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="المشاريع المكتملة"
          value={client.completedProjects ?? 0}
          colorClass="text-blue-500"
        />
        <StatCard
          icon={XCircle}
          label="المشاريع الملغية"
          value={client.cancelledProjects ?? 0}
          colorClass="text-red-500"
        />
        <StatCard
          icon={DollarSign}
          label="إجمالي قيمة العقود"
          value={formatCurrency(client.totalContractValue)}
        />
        <StatCard
          icon={CreditCard}
          label="إجمالي المدفوع"
          value={formatCurrency(client.totalPaid)}
        />
        <StatCard
          icon={Star}
          label="متوسط التقييم"
          value={
            client.avgSatisfactionScore != null
              ? `${client.avgSatisfactionScore}/5`
              : "—"
          }
          colorClass="text-yellow-500"
        />
        <StatCard
          icon={Calendar}
          label="آخر نشاط"
          value={formatDate(client.updatedAt)}
        />
      </div>

      {/* Profile Summary */}
      {profile && (
        <SurfaceCard title="الملف التعريفي" icon={Building2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {profile.industry && (
              <div>
                <p className="text-neutral-300 mb-1">المجال</p>
                <p className="font-medium">{profile.industry}</p>
              </div>
            )}
            {profile.businessDescription && (
              <div className="md:col-span-2">
                <p className="text-neutral-300 mb-1">وصف النشاط</p>
                <p className="font-medium leading-relaxed">
                  {profile.businessDescription}
                </p>
              </div>
            )}
            {profile.targetAudience && (
              <div>
                <p className="text-neutral-300 mb-1 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  الجمهور المستهدف
                </p>
                <p className="font-medium">{profile.targetAudience}</p>
              </div>
            )}
            {(profile.budgetRangeMin != null ||
              profile.budgetRangeMax != null) && (
              <div>
                <p className="text-neutral-300 mb-1 flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" />
                  نطاق الميزانية
                </p>
                <p className="font-medium">
                  {profile.budgetRangeMin != null &&
                    formatCurrency(profile.budgetRangeMin)}
                  {profile.budgetRangeMin != null &&
                    profile.budgetRangeMax != null &&
                    " — "}
                  {profile.budgetRangeMax != null &&
                    formatCurrency(profile.budgetRangeMax)}
                </p>
              </div>
            )}
            {profile.preferredPlatforms && (
              <div>
                <p className="text-neutral-300 mb-1 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  المنصات المفضلة
                </p>
                <p className="font-medium">{profile.preferredPlatforms}</p>
              </div>
            )}
            {profile.communicationPreference && (
              <div>
                <p className="text-neutral-300 mb-1">وسيلة التواصل المفضلة</p>
                <p className="font-medium">
                  {profile.communicationPreference === "email"
                    ? "بريد إلكتروني"
                    : profile.communicationPreference === "whatsapp"
                      ? "واتساب"
                      : profile.communicationPreference === "phone"
                        ? "هاتف"
                        : profile.communicationPreference === "chat"
                          ? "محادثة"
                          : profile.communicationPreference}
                </p>
              </div>
            )}
            {profile.preferredLanguage && (
              <div>
                <p className="text-neutral-300 mb-1">اللغة المفضلة</p>
                <p className="font-medium">{profile.preferredLanguage}</p>
              </div>
            )}
            {profile.timezone && (
              <div>
                <p className="text-neutral-300 mb-1">المنطقة الزمنية</p>
                <p className="font-medium">{profile.timezone}</p>
              </div>
            )}
          </div>
        </SurfaceCard>
      )}

      {!profile && (
        <SurfaceCard title="الملف التعريفي">
          <p className="text-sm text-neutral-300 text-center py-4">
            لم يتم إضافة ملف تعريفي بعد. يمكنك إضافته من تبويب &quot;الملف
            التعريفي&quot;.
          </p>
        </SurfaceCard>
      )}
    </div>
  );
}
