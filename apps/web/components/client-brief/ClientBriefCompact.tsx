"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { ClientStatus, BusinessType } from "@hassad/shared";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { Pill } from "@/components/design-system/Pill";
import { BriefCard } from "./BriefCard";
import { ClientBriefField } from "./ClientBriefField";
import { formatDate } from "@/lib/format";
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
  Globe,
  MessageCircle,
  FileText,
  Banknote,
  Link as LinkIcon,
  Hash,
  Palette,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface ClientBriefCompactProps {
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

const COMM_PREF_LABELS: Record<string, string> = {
  email: "بريد إلكتروني",
  whatsapp: "واتساب",
  phone: "هاتف",
  chat: "محادثة",
};

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

export function ClientBriefCompact({
  client,
  profile,
  viewAs = "internal",
}: ClientBriefCompactProps) {
  const statusTone = STATUS_TONE[client.status as ClientStatus] ?? "neutral";
  const statusLabel =
    STATUS_LABELS[client.status as ClientStatus] ?? client.status;

  // Prefer V2 visualIdentityInfo.brandAssets over legacy brandAssets
  const v2BrandAssets = profile?.visualIdentityInfo?.brandAssets;
  const legacyBrandAssets = profile?.brandAssets;

  const logoUrl = v2BrandAssets?.logoUrl ?? legacyBrandAssets?.logoUrl ?? null;
  const brandAssets = v2BrandAssets ?? legacyBrandAssets;
  const isInternalRestricted = viewAs === "internal";

  // Prefer V2 communicationInfo.industry over legacy industry
  const industry = profile?.communicationInfo?.industry ?? profile?.industry;

  const hasSocialLinks =
    profile?.website ||
    profile?.instagramHandle ||
    profile?.tiktokHandle ||
    profile?.twitterHandle ||
    profile?.linkedinUrl ||
    profile?.snapchatHandle;

  const hasBusinessInfo =
    industry ||
    profile?.targetAudience ||
    profile?.budgetRangeMin != null ||
    profile?.budgetRangeMax != null ||
    profile?.preferredPlatforms ||
    profile?.communicationPreference ||
    profile?.businessDescription;

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

        {/* Contact info */}
        <div className="mt-6 space-y-3">
          <ClientBriefField
            icon={Mail}
            label="البريد الإلكتروني"
            value={client.email}
            href={client.email ? `mailto:${client.email}` : undefined}
            dir="ltr"
          />
          <ClientBriefField
            icon={Phone}
            label="واتساب / هاتف"
            value={client.phoneWhatsapp}
            href={
              client.phoneWhatsapp
                ? `https://wa.me/${client.phoneWhatsapp}`
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
        {hasBusinessInfo && (
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
              {!isInternalRestricted && (
                <ClientBriefField
                  icon={Banknote}
                  label="نطاق الميزانية"
                  value={
                    profile?.budgetRangeMin != null ||
                    profile?.budgetRangeMax != null
                      ? `${
                          profile?.budgetRangeMin != null
                            ? `${profile.budgetRangeMin.toLocaleString("ar-SA")} ر.س`
                            : "—"
                        } — ${
                          profile?.budgetRangeMax != null
                            ? `${profile.budgetRangeMax.toLocaleString("ar-SA")} ر.س`
                            : "—"
                        }`
                      : null
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

      {/* Digital Presence + Brand Assets side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
          {!hasSocialLinks && (
            <p className="text-sm text-portal-note-text text-center py-6">
              لم تتم إضافة قنوات رقمية بعد
            </p>
          )}
        </BriefCard>

        <BriefCard
          title="الهوية البصرية"
          description="أصول العلامة التجارية"
          icon={Palette}
        >
          <div className="space-y-4">
            {brandAssets?.logoUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={brandAssets.logoUrl}
                  alt="الشعار"
                  className="w-12 h-12 rounded-lg object-contain border border-portal-card-border bg-white"
                />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-300">الشعار</p>
                  <p
                    className="text-xs text-portal-note-text truncate"
                    dir="ltr"
                  >
                    {brandAssets.logoUrl}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-portal-note-text text-center py-4">
                لم يتم إضافة شعار
              </p>
            )}

            {brandAssets?.brandColors && brandAssets.brandColors.length > 0 && (
              <div>
                <p className="text-xs text-neutral-300 mb-2">ألوان العلامة</p>
                <div className="flex flex-wrap gap-2">
                  {brandAssets.brandColors.map((color, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-portal-card-border px-2 py-1.5"
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-portal-card-border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-natural-100" dir="ltr">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {brandAssets?.fonts && brandAssets.fonts.length > 0 && (
              <div>
                <p className="text-xs text-neutral-300 mb-1">الخطوط</p>
                <p className="text-sm text-natural-100">
                  {brandAssets.fonts.join("، ")}
                </p>
              </div>
            )}

            {brandAssets?.guidelinesUrl && (
              <a
                href={brandAssets.guidelinesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-secondary-500 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                دليل الهوية البصرية
              </a>
            )}

            {!brandAssets?.logoUrl &&
              !brandAssets?.brandColors?.length &&
              !brandAssets?.fonts?.length &&
              !brandAssets?.guidelinesUrl && (
                <p className="text-sm text-portal-note-text text-center py-6">
                  لم تتم إضافة أصول بصرية بعد
                </p>
              )}
          </div>
        </BriefCard>
      </div>

      {/* Pain Points */}
      {profile?.painPoints && !isInternalRestricted && (
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
