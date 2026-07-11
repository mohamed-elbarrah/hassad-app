"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { Pill } from "@/components/design-system/Pill";
import { ClientBriefField } from "./ClientBriefField";
import { BriefCard } from "./BriefCard";
import { SIDEBAR_VISIBILITY, type SidebarField } from "./profile-visibility";
import type { IdentityViewModel } from "./useClientBrief";
import { UserRole } from "@hassad/shared";
import {
  Mail,
  Phone,
  Building2,
  User,
  Calendar,
  Crown,
  Clock,
} from "lucide-react";

interface IdentitySidebarProps {
  identity: IdentityViewModel;
  role: UserRole;
  decisionMakerName?: string | null;
  decisionMakerPhone?: string | null;
  workingHours?: string | null;
}

/** Map each SidebarField to its render function */
const FIELD_RENDERERS: Record<
  SidebarField,
  (
    identity: IdentityViewModel,
    decisionMakerValue: string | null,
    workingHours: string | null,
  ) => React.ReactNode
> = {
  email: (identity) =>
    identity.email ? (
      <ClientBriefField
        key="email"
        icon={Mail}
        label="البريد الإلكتروني"
        value={identity.email}
        href={`mailto:${identity.email}`}
        dir="ltr"
      />
    ) : null,

  phone: (identity) =>
    identity.phoneWhatsapp ? (
      <ClientBriefField
        key="phone"
        icon={Phone}
        label="رقم التواصل"
        value={identity.phoneWhatsapp}
        href={`https://wa.me/${identity.phoneWhatsapp}`}
        dir="ltr"
      />
    ) : null,

  businessType: (identity) => (
    <ClientBriefField
      key="businessType"
      icon={Building2}
      label={identity.industryLabel ? "المجال" : "نوع النشاط"}
      value={identity.industryLabel || identity.businessTypeLabel}
    />
  ),

  decisionMaker: (_identity, decisionMakerValue) =>
    decisionMakerValue ? (
      <ClientBriefField
        key="decisionMaker"
        icon={Crown}
        label="صانع القرار"
        value={decisionMakerValue}
        dir="ltr"
      />
    ) : null,

  workingHours: (_identity, _dmValue, workingHours) =>
    workingHours ? (
      <ClientBriefField
        key="workingHours"
        icon={Clock}
        label="أوقات التواصل المفضلة"
        value={workingHours}
      />
    ) : null,

  accountManager: (identity) =>
    identity.managerName ? (
      <ClientBriefField
        key="accountManager"
        icon={User}
        label="مدير الحساب"
        value={identity.managerName}
      />
    ) : null,

  createdAt: (identity) =>
    identity.createdAtLabel ? (
      <ClientBriefField
        key="createdAt"
        icon={Calendar}
        label="تاريخ الإضافة"
        value={identity.createdAtLabel}
      />
    ) : null,
};

export function IdentitySidebar({
  identity,
  role,
  decisionMakerName,
  decisionMakerPhone,
  workingHours,
}: IdentitySidebarProps) {
  const visibility =
    SIDEBAR_VISIBILITY[role] ?? SIDEBAR_VISIBILITY[UserRole.ADMIN];

  const decisionMakerValue = decisionMakerName
    ? decisionMakerPhone
      ? `${decisionMakerName} — ${decisionMakerPhone}`
      : decisionMakerName
    : null;

  return (
    <div className="space-y-5 lg:sticky lg:top-0">
      <BriefCard contentClassName="p-5">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <UserAvatar
              name={identity.companyName}
              avatarUrl={identity.logoUrl}
              size="xl"
              variant="circle"
              showBorder
            />
            <span
              className={cn(
                "absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white",
                identity.statusTone === "success" && "bg-success-500",
                identity.statusTone === "danger" && "bg-danger-500",
                identity.statusTone === "purple" && "bg-action-purple",
                identity.statusTone === "neutral" && "bg-neutral-300",
              )}
            />
          </div>

          <h2 className="text-lg font-bold text-natural-100 mt-4">
            {identity.companyName}
          </h2>

          {/* Subtitle — only shown when the role needs it */}
          {visibility.showContactSubtitle && identity.subtitle && (
            <p className="text-sm text-portal-note-text mt-1">
              {identity.subtitle}
            </p>
          )}

          <div className="mt-3">
            <Pill tone={identity.statusTone} className="text-xs h-6 px-2.5">
              {identity.statusLabel}
            </Pill>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {visibility.fields.map((field) =>
            FIELD_RENDERERS[field](identity, decisionMakerValue, workingHours),
          )}
        </div>
      </BriefCard>
    </div>
  );
}
