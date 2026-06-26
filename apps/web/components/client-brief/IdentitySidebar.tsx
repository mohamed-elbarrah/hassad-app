"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { Pill } from "@/components/design-system/Pill";
import { ClientBriefField } from "./ClientBriefField";
import { BriefCard } from "./BriefCard";
import type { IdentityViewModel } from "./useClientBrief";
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
  decisionMakerName?: string | null;
  decisionMakerPhone?: string | null;
  workingHours?: string | null;
}

export function IdentitySidebar({
  identity,
  decisionMakerName,
  decisionMakerPhone,
  workingHours,
}: IdentitySidebarProps) {
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
          {identity.subtitle && (
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
          <ClientBriefField
            icon={Mail}
            label="البريد الإلكتروني"
            value={identity.email}
            href={identity.email ? `mailto:${identity.email}` : undefined}
            dir="ltr"
          />
          <ClientBriefField
            icon={Phone}
            label="رقم التواصل"
            value={identity.phoneWhatsapp}
            href={
              identity.phoneWhatsapp
                ? `https://wa.me/${identity.phoneWhatsapp}`
                : undefined
            }
            dir="ltr"
          />
          <ClientBriefField
            icon={Building2}
            label={identity.industryLabel ? "المجال" : "نوع النشاط"}
            value={identity.industryLabel || identity.businessTypeLabel}
          />
          {decisionMakerValue && (
            <ClientBriefField
              icon={Crown}
              label="صانع القرار"
              value={decisionMakerValue}
              dir={decisionMakerPhone ? "ltr" : "rtl"}
            />
          )}
          {workingHours && (
            <ClientBriefField
              icon={Clock}
              label="أوقات التواصل المفضلة"
              value={workingHours}
            />
          )}
          <ClientBriefField
            icon={User}
            label="مدير الحساب"
            value={identity.managerName}
          />
          <ClientBriefField
            icon={Calendar}
            label="تاريخ الإضافة"
            value={identity.createdAtLabel}
          />
        </div>
      </BriefCard>
    </div>
  );
}
