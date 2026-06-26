/**
 * ClientBriefV2 - View mode implementation using shared ProfileSections
 * 
 * This component demonstrates Rule 3: ONE component definition = THREE behaviors
 * - CommunicationSection mode="view" → Profile display
 * - ProductSection mode="view" → Profile display
 * - etc.
 * 
 * Uses V2 fields from ClientProfile as the single source of truth (Rule 1)
 */

"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { ClientStatus, BusinessType } from "@hassad/shared";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { Pill } from "@/components/design-system/Pill";
import { BriefCard } from "./BriefCard";
import { ClientBriefStatCard } from "./ClientBriefStatCard";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import {
  CommunicationSection,
  ProductSection,
  AudienceSection,
  JourneySection,
  CampaignSection,
  PerformanceSection,
  VisualSection,
} from "@/components/shared/ProfileSections";
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  XCircle,
  DollarSign,
  CreditCard,
} from "lucide-react";

export type ClientBriefView = "portal" | "sales" | "internal";

interface ClientBriefV2Props {
  client: Client;
  profile: ClientProfile | null;
  viewAs?: ClientBriefView;
}

const STATUS_TONE: Record<
  ClientStatus,
  import("@/components/design-system/Pill").PillTone
> = {
  [ClientStatus.LEAD]: "purple",
  [ClientStatus.ACTIVE]: "success",
  [ClientStatus.STOPPED]: "danger",
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: "عميل محتمل",
  [ClientStatus.ACTIVE]: "نشط",
  [ClientStatus.STOPPED]: "متوقف",
};

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم",
  [BusinessType.CLINIC]: "عيادة",
  [BusinessType.STORE]: "متجر",
  [BusinessType.SERVICE]: "خدمة",
  [BusinessType.OTHER]: "أخرى",
};

export function ClientBriefV2({
  client,
  profile,
  viewAs = "internal",
}: ClientBriefV2Props) {
  const statusTone = STATUS_TONE[client.status as ClientStatus] ?? "neutral";
  const statusLabel =
    STATUS_LABELS[client.status as ClientStatus] ?? client.status;

  const totalProjects =
    (client.activeProjects ?? 0) +
    (client.completedProjects ?? 0) +
    (client.cancelledProjects ?? 0);

  const isInternalRestricted = viewAs === "internal";

  // Get V2 logo from visualIdentityInfo
  const logoUrl = profile?.visualIdentityInfo?.brandAssets?.logoUrl ?? null;

  return (
    <div className="space-y-5" dir="rtl">
      {/* Identity Card - Core client info */}
      <section className="rounded-2xl border border-portal-card-border bg-natural-0 p-5 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <UserAvatar
              name={client.companyName}
              avatarUrl={logoUrl}
              size="xl"
              variant="circle"
              showBorder
            />
            <span
              className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                statusTone === "success"
                  ? "bg-success-500"
                  : statusTone === "danger"
                    ? "bg-danger-500"
                    : statusTone === "purple"
                      ? "bg-action-purple"
                      : "bg-neutral-300"
              }`}
            />
          </div>

          <h2 className="text-lg font-bold text-natural-100 mt-4">
            {client.companyName}
          </h2>
          <p className="text-sm text-portal-note-text mt-1">
            {client.contactName
              ? `المسؤول: ${client.contactName}`
              : (BUSINESS_TYPE_LABELS[client.businessType as BusinessType] ??
                client.businessType)}
          </p>

          <div className="mt-3">
            <Pill tone={statusTone} className="text-xs h-6 px-2.5">
              {statusLabel}
            </Pill>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-secondary-50">
            <p className="text-2xl font-bold text-secondary-600">
              {client.activeProjects ?? 0}
            </p>
            <p className="text-xs text-portal-note-text">مشاريع نشطة</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-success-50">
            <p className="text-2xl font-bold text-success-600">
              {client.completedProjects ?? 0}
            </p>
            <p className="text-xs text-portal-note-text">مكتملة</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-primary-50">
            <p className="text-2xl font-bold text-primary-600">
              {client.totalPaid != null ? `${(client.totalPaid / 1000).toFixed(0)}k` : '—'}
            </p>
            <p className="text-xs text-portal-note-text">مدفوع</p>
          </div>
        </div>
      </section>

      {/* Key Metrics - System generated data (Rule 2: Separation of Concerns) */}
      <BriefCard
        title="إحصائيات العميل"
        description="بيانات النظام"
        icon={Briefcase}
      >
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
          {!isInternalRestricted && (
            <>
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
            </>
          )}
        </div>
      </BriefCard>

      {/* V2 Profile Sections - User-editable data (Rule 1: Single Source of Truth) */}
      {/* Each section uses mode="view" for read-only display (Rule 3: Shared Components) */}
      
      {/* Section 1: Communication */}
      <CommunicationSection
        mode="view"
        initialData={profile?.communicationInfo ?? undefined}
      />

      {/* Section 2: Product/Service */}
      <ProductSection
        mode="view"
        initialData={profile?.productInfo ?? undefined}
      />

      {/* Section 3: Audience & Brand Voice */}
      <AudienceSection
        mode="view"
        initialData={{
          customerAnalysis: profile?.audienceInfo?.customerAnalysis,
          faq: profile?.audienceInfo?.faq,
          toneOfVoice: profile?.brandVoice?.toneOfVoice,
          boundaries: profile?.brandVoice?.boundaries,
          verbalSlogan: profile?.brandVoice?.verbalSlogan,
          appearanceMethod: profile?.brandVoice?.appearanceMethod,
        }}
      />

      {/* Section 4: Customer Journey */}
      <JourneySection
        mode="view"
        initialData={profile?.customerJourney ?? undefined}
      />

      {/* Section 5: Campaign */}
      <CampaignSection
        mode="view"
        initialData={profile?.campaignInfo ?? undefined}
      />

      {/* Section 6: Performance & Budget */}
      <PerformanceSection
        mode="view"
        initialData={{
          pastPerformance: profile?.pastPerformance ?? undefined,
          budgetInfo: profile?.budgetInfo ?? undefined,
        }}
      />

      {/* Section 7: Visual Identity */}
      <VisualSection
        mode="view"
        initialData={{
          hasVisualIdentity: profile?.visualIdentityInfo?.hasVisualIdentity,
          pastDesigns: profile?.visualIdentityInfo?.pastDesigns,
          visualDirection: profile?.visualIdentityInfo?.visualDirection,
          brandAssets: profile?.visualIdentityInfo?.brandAssets,
          productPhotos: profile?.visualIdentityInfo?.productPhotos,
        }}
      />

      {/* Last Updated */}
      {client.updatedAt && (
        <p className="text-xs text-portal-note-text text-center">
          آخر تحديث: {formatRelativeTime(String(client.updatedAt))}
        </p>
      )}
    </div>
  );
}