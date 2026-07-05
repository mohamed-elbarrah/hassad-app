"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { ClientStatus, BusinessType } from "@hassad/shared";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { Pill } from "@/components/design-system/Pill";
import { ClientBriefField } from "./ClientBriefField";
import { formatDate } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencySymbol } from "@/components/design-system/CurrencySymbol";
import type { ClientBriefView } from "./ClientBrief";
import {
  Building2,
  Mail,
  Phone,
  User,
  Calendar,
  Clock,
  Crown,
  Target,
  Banknote,
  Globe,
  MessageCircle,
  FileText,
} from "lucide-react";

interface ClientBriefIdentityProps {
  client: Client;
  profile: ClientProfile | null;
  viewAs: ClientBriefView;
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

const COMM_PREF_LABELS: Record<string, string> = {
  email: "بريد إلكتروني",
  whatsapp: "واتساب",
  phone: "هاتف",
  chat: "محادثة",
};

export function ClientBriefIdentity({
  client,
  profile,
  viewAs,
}: ClientBriefIdentityProps) {
  const { fmtAmount } = useCurrency();
  const statusTone = STATUS_TONE[client.status as ClientStatus] ?? "neutral";
  const statusLabel =
    STATUS_LABELS[client.status as ClientStatus] ?? client.status;

  // Prefer V2 visualIdentityInfo.brandAssets for logo
  const v2BrandAssets = profile?.visualIdentityInfo?.brandAssets;
  const legacyBrandAssets = profile?.brandAssets;

  const logoUrl = v2BrandAssets?.logoUrl ?? legacyBrandAssets?.logoUrl ?? null;

  // Prefer V2 field (communicationInfo.industry) over legacy field
  const industry = profile?.communicationInfo?.industry ?? profile?.industry;
  const subtitle = client.user?.name
    ? `المسؤول: ${client.user.name}`
    : (BUSINESS_TYPE_LABELS[client.businessType as BusinessType] ??
      client.businessType);

  return (
    <div className="space-y-5">
      {/* Identity + Business Info merged card */}
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
          <p className="text-sm text-portal-note-text mt-1">{subtitle}</p>

          <div className="mt-3">
            <Pill tone={statusTone} className="text-xs h-6 px-2.5">
              {statusLabel}
            </Pill>
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-6 space-y-3">
          <ClientBriefField
            icon={Mail}
            label="البريد الإلكتروني"
            value={client.user?.email}
            href={
              client.user?.email ? `mailto:${client.user.email}` : undefined
            }
            dir="ltr"
          />
          <ClientBriefField
            icon={Phone}
            label="واتساب / هاتف"
            value={client.user?.phoneWhatsapp}
            href={
              client.user?.phoneWhatsapp
                ? `https://wa.me/${client.user.phoneWhatsapp}`
                : undefined
            }
            dir="ltr"
          />
          <ClientBriefField
            icon={Building2}
            label="نوع النشاط"
            value={
              BUSINESS_TYPE_LABELS[client.businessType as BusinessType] ??
              client.businessType
            }
          />
          {profile?.decisionMakerName && (
            <ClientBriefField
              icon={Crown}
              label="صانع القرار"
              value={
                profile.decisionMakerPhone
                  ? `${profile.decisionMakerName} — ${profile.decisionMakerPhone}`
                  : profile.decisionMakerName
              }
              dir={profile.decisionMakerPhone ? "ltr" : "rtl"}
            />
          )}
          {profile?.workingHours && (
            <ClientBriefField
              icon={Clock}
              label="أوقات التواصل المفضلة"
              value={profile.workingHours}
            />
          )}
          <ClientBriefField
            icon={User}
            label="مدير الحساب"
            value={client.manager?.name}
          />
          <ClientBriefField
            icon={Calendar}
            label="تاريخ الإضافة"
            value={formatDate(client.createdAt)}
          />
        </div>

        {/* Divider + Business Info */}
        {(industry ||
          profile?.targetAudience ||
          profile?.budgetRangeMin != null ||
          profile?.budgetRangeMax != null ||
          profile?.preferredPlatforms ||
          profile?.communicationPreference ||
          profile?.businessDescription) && (
          <>
            <div className="h-px bg-portal-divider my-5" />
            <h3 className="text-sm font-semibold text-natural-100 mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-secondary-500" />
              معلومات النشاط
            </h3>
            <div className="space-y-3">
              <ClientBriefField
                icon={Building2}
                label="المجال / القطاع"
                value={industry}
              />
              <ClientBriefField
                icon={Target}
                label="الجمهور المستهدف"
                value={profile?.targetAudience}
              />
              {viewAs !== "internal" && (
                <ClientBriefField
                  icon={Banknote}
                  label="نطاق الميزانية"
                  value={
                    profile?.budgetRangeMin != null ||
                    profile?.budgetRangeMax != null ? (
                      <>
                        {profile?.budgetRangeMin != null ? (
                          <>
                            {fmtAmount(profile.budgetRangeMin)}{" "}
                            <CurrencySymbol className="inline-block" />
                          </>
                        ) : (
                          "—"
                        )}
                        {" — "}
                        {profile?.budgetRangeMax != null ? (
                          <>
                            {fmtAmount(profile.budgetRangeMax)}{" "}
                            <CurrencySymbol className="inline-block" />
                          </>
                        ) : (
                          "—"
                        )}
                      </>
                    ) : null
                  }
                />
              )}
              <ClientBriefField
                icon={Globe}
                label="المنصات المفضلة"
                value={profile?.preferredPlatforms}
              />
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
            </div>
            {profile?.businessDescription && (
              <div className="mt-4 pt-4 border-t border-portal-divider">
                <p className="text-xs text-neutral-300 font-medium mb-1">
                  <FileText className="h-3 w-3 inline me-1" />
                  وصف النشاط
                </p>
                <p className="text-sm text-natural-100 leading-relaxed">
                  {profile.businessDescription}
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
