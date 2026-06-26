"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { BriefCard } from "./BriefCard";
import { ClientBriefStatCard } from "./ClientBriefStatCard";
import { ClientBriefField } from "./ClientBriefField";
import { formatRelativeTime } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencySymbol } from "@/components/design-system/CurrencySymbol";
import type { ClientBriefView } from "./ClientBrief";
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  XCircle,
  DollarSign,
  CreditCard,
  Globe,
  Activity,
  Clock,
  AlertCircle,
  Hash,
} from "lucide-react";

interface ClientBriefOverviewProps {
  client: Client;
  profile: ClientProfile | null;
  viewAs: ClientBriefView;
}

function SocialLink({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (!value) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-portal-card-border p-3 hover:bg-secondary-50/50 transition-colors"
      dir="ltr"
    >
      <div className="shrink-0 w-9 h-9 rounded-lg bg-secondary-50 flex items-center justify-center">
        <Icon className="h-4 w-4 text-secondary-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-neutral-300 font-medium">
          {label}
        </p>
        <p className="text-sm font-medium text-natural-100 truncate">{value}</p>
      </div>
    </a>
  );
}

export function ClientBriefOverview({
  client,
  profile,
  viewAs,
}: ClientBriefOverviewProps) {
  const { fmtAmount } = useCurrency();
  const totalProjects =
    (client.activeProjects ?? 0) +
    (client.completedProjects ?? 0) +
    (client.cancelledProjects ?? 0);

  const isInternalRestricted = viewAs === "internal";

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
          value={
            <>
              {fmtAmount(client.totalContractValue)}{" "}
              <CurrencySymbol className="inline-block" />
            </>
          }
          colorClass="text-primary-500"
        />
        <ClientBriefStatCard
          icon={CreditCard}
          label="إجمالي المدفوع"
          value={
            <>
              {fmtAmount(client.totalPaid)} <CurrencySymbol className="inline-block" />
            </>
          }
          colorClass="text-action-purple"
        />
      </div>

      {/* Financial snapshot — only for sales/portal (portal sees their own) */}
      {!isInternalRestricted &&
        (client.totalContractValue > 0 || client.totalPaid > 0) && (
          <BriefCard
            title="ملخص مالي"
            description="نظرة سريعة على الوضع المالي"
            icon={DollarSign}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-portal-note-text">
                  إجمالي قيمة العقود
                </span>
                <span className="text-sm font-bold text-natural-100">
                  {fmtAmount(client.totalContractValue)}{" "}
                  <CurrencySymbol className="inline-block" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-portal-note-text">
                  إجمالي المدفوع
                </span>
                <span className="text-sm font-bold text-success-600">
                  {fmtAmount(client.totalPaid)}{" "}
                  <CurrencySymbol className="inline-block" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-portal-note-text">المتبقي</span>
                <span className="text-sm font-bold text-natural-100">
                  {fmtAmount(
                    (client.totalContractValue ?? 0) - (client.totalPaid ?? 0),
                  )}{" "}
                  <CurrencySymbol className="inline-block" />
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-success-500"
                  style={{
                    width: `${Math.min(
                      (client.totalContractValue ?? 0) > 0
                        ? ((client.totalPaid ?? 0) /
                            client.totalContractValue) *
                            100
                        : 0,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </BriefCard>
        )}

      {/* Activity + Digital Presence side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BriefCard
          title="النشاط"
          description="نظرة على حركة العميل"
          icon={Activity}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-portal-note-text">آخر تحديث</span>
              <span className="text-sm font-medium text-natural-100">
                {formatRelativeTime(String(client.updatedAt))}
              </span>
            </div>

            <div className="h-px bg-portal-divider" />

            <div className="grid grid-cols-2 gap-3">
              <ClientBriefStatCard
                icon={Briefcase}
                label="مشاريع نشطة"
                value={client.activeProjects ?? 0}
                colorClass="text-success-500"
              />
              <ClientBriefStatCard
                icon={Activity}
                label="إجمالي المشاريع"
                value={totalProjects}
                colorClass="text-secondary-500"
              />
            </div>

            {viewAs !== "internal" && client.avgSatisfactionScore != null && (
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-portal-note-text">
                    معدل الرضا
                  </span>
                  <span className="text-sm font-bold text-natural-100">
                    {client.avgSatisfactionScore} / 5
                  </span>
                </div>
              </div>
            )}
          </div>
        </BriefCard>

        <BriefCard
          title="ال presence الرقمية"
          description="قنوات العميل على الإنترنت"
          icon={Globe}
        >
          <div className="space-y-3">
            <SocialLink
              label="الموقع الإلكتروني"
              value={profile?.website}
              href={profile?.website ?? "#"}
              icon={Hash}
            />
            <SocialLink
              label="انستغرام"
              value={profile?.instagramHandle}
              href={`https://instagram.com/${profile?.instagramHandle}`}
              icon={Hash}
            />
            <SocialLink
              label="تيك توك"
              value={profile?.tiktokHandle}
              href={`https://tiktok.com/@${profile?.tiktokHandle}`}
              icon={Hash}
            />
            <SocialLink
              label="تويتر / إكس"
              value={profile?.twitterHandle}
              href={`https://x.com/${profile?.twitterHandle}`}
              icon={Hash}
            />
            <SocialLink
              label="لينكد إن"
              value={profile?.linkedinUrl}
              href={profile?.linkedinUrl ?? "#"}
              icon={Hash}
            />
            <SocialLink
              label="سناب شات"
              value={profile?.snapchatHandle}
              href={`https://snapchat.com/add/${profile?.snapchatHandle}`}
              icon={Hash}
            />
          </div>
          {!profile?.website &&
            !profile?.instagramHandle &&
            !profile?.tiktokHandle &&
            !profile?.twitterHandle &&
            !profile?.linkedinUrl &&
            !profile?.snapchatHandle && (
              <p className="text-sm text-portal-note-text text-center py-6">
                لم تتم إضافة قنوات رقمية بعد
              </p>
            )}
        </BriefCard>
      </div>

      {/* Pain Points */}
      {profile?.painPoints && (
        <BriefCard
          title="نقاط الألم والتحديات"
          description="ما يواجهه العميل من تحديات"
          icon={AlertCircle}
        >
          <p className="text-sm text-natural-100 leading-relaxed">
            {profile.painPoints}
          </p>
        </BriefCard>
      )}
    </div>
  );
}
