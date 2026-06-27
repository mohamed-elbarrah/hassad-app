/**
 * useClientBrief - ViewModel hook for client brief/profile display
 *
 * Single source of truth for transforming raw Client + ClientProfile data
 * into a clean view model used by ClientBriefV2 and related components.
 *
 * Rules:
 * - No backend logic here.
 * - All formatting (currency, labels, dates) happens in this hook.
 * - Consumers receive plain data ready for JSX.
 *
 * Ownership boundaries:
 * - `Client` owns business fields (companyName, businessType, accountManager,
 *   status, denormalized counters).
 * - `User` owns the logged-in person's identity (name, email, phoneWhatsapp,
 *   avatarUrl). This is the single source of truth for personal contact
 *   info shown on portal pages.
 * - `Client.contactName` / `ClientProfile.communicationInfo.contactName`
 *   are CRM-side fields used by the internal dashboard. They can differ
 *   from `User.name` (B2B context: the contact at the company may not be
 *   the same person who logs in).
 *
 * When the `user` option is provided (portal context), personal identity
 * fields are read from `User` — guaranteeing the portal profile page
 * shows the same name/email/phone as `/portal/account`. When `user` is
 * omitted (dashboard / CRM context), the hook falls back to `Client` for
 * backward compatibility.
 */

"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { ClientStatus, BusinessType } from "@hassad/shared";
import type { PillTone } from "@/components/design-system/Pill";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";

/**
 * Minimal User shape required by this hook. We accept the shape rather
 * than the full `User` type so callers (which read from Redux auth state)
 * don't need to satisfy every relation on the full model.
 */
export interface ClientBriefUser {
  name: string;
  email: string;
  phoneWhatsapp?: string | null;
  avatarUrl?: string | null;
}

export type ClientBriefView = "portal" | "sales" | "internal";

const STATUS_TONE: Record<ClientStatus, PillTone> = {
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

export interface IdentityViewModel {
  companyName: string;
  contactName?: string | null;
  subtitle?: string | null;
  statusLabel: string;
  statusTone: PillTone;
  logoUrl?: string | null;
  email: string;
  phoneWhatsapp?: string | null;
  businessTypeLabel?: string;
  industryLabel?: string | null;
  managerName?: string | null;
  createdAtLabel?: string;
  updatedAtLabel?: string;
}

export interface KpiViewModel {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  contractValue: string;
  totalPaid: string;
  paidRatioPercent: number;
}

export interface ClientBriefViewModel {
  identity: IdentityViewModel;
  kpis: KpiViewModel;
  profile: ClientProfile | null;
  viewAs: ClientBriefView;
  meta: {
    updatedAtLabel?: string;
  };
}

interface UseClientBriefOptions {
  client: Client;
  profile: ClientProfile | null;
  /**
   * When provided (portal context), personal identity fields are read
   * from this User object — guaranteeing the portal profile page shows
   * the same name/email/phone as `/portal/account`. When omitted
   * (dashboard / CRM context), the hook falls back to `Client` fields.
   */
  user?: ClientBriefUser | null;
  viewAs?: ClientBriefView;
}

export function useClientBrief({
  client,
  profile,
  user = null,
  viewAs = "internal",
}: UseClientBriefOptions): ClientBriefViewModel {
  const { fmtAmount } = useCurrency();
  const status = client.status as ClientStatus;
  const statusTone = STATUS_TONE[status] ?? "neutral";
  const statusLabel = STATUS_LABELS[status] ?? client.status;

  const businessType = client.businessType as BusinessType;
  const businessTypeLabel =
    BUSINESS_TYPE_LABELS[businessType] ?? client.businessType;

  // -----------------------------------------------------------------
  // Ownership-aware contact resolution.
  //
  // When `user` is provided (portal), personal identity fields come from
  // `User` — the single source of truth for the logged-in person. This
  // guarantees `/portal/profile` shows the same name/email/phone as
  // `/portal/account` (both read from `User`).
  //
  // When `user` is omitted (dashboard / CRM), the hook falls back to
  // `Client` fields, preserving the existing CRM behavior where the
  // business contact at the company may differ from the login identity.
  //
  // `industry` is marketing-specific and always comes from the intake
  // wizard (ClientProfile.communicationInfo.industry) when available.
  // -----------------------------------------------------------------
  const communication = profile?.communicationInfo;
  const displayIndustry = communication?.industry;

  const displayBusinessName = communication?.businessName || client.companyName;
  const displayContactName =
    user?.name ?? communication?.contactName ?? client.contactName;
  const displayPhone =
    user?.phoneWhatsapp ?? communication?.contactNumber ?? client.phoneWhatsapp;
  const displayEmail = user?.email ?? communication?.email ?? client.email;

  const v2BrandAssets = profile?.visualIdentityInfo?.brandAssets;
  const legacyBrandAssets = profile?.brandAssets;
  const logoUrl = v2BrandAssets?.logoUrl ?? legacyBrandAssets?.logoUrl ?? null;

  const subtitle = displayContactName
    ? `المسؤول: ${displayContactName}`
    : (businessTypeLabel ?? null);

  const totalProjects =
    (client.activeProjects ?? 0) +
    (client.completedProjects ?? 0) +
    (client.cancelledProjects ?? 0);

  const totalContractValue = client.totalContractValue ?? 0;
  const totalPaid = client.totalPaid ?? 0;
  const paidRatioPercent =
    totalContractValue > 0
      ? Math.min(Math.round((totalPaid / totalContractValue) * 100), 100)
      : 0;

  return {
    identity: {
      companyName: displayBusinessName,
      contactName: displayContactName,
      subtitle,
      statusLabel,
      statusTone,
      logoUrl,
      email: displayEmail,
      phoneWhatsapp: displayPhone,
      businessTypeLabel,
      managerName: client.manager?.name,
      createdAtLabel: formatDate(client.createdAt),
      updatedAtLabel: formatRelativeTime(String(client.updatedAt)),
      // Extra derived fields consumed by the identity sidebar
      industryLabel: displayIndustry,
    },
    kpis: {
      totalProjects,
      activeProjects: client.activeProjects ?? 0,
      completedProjects: client.completedProjects ?? 0,
      cancelledProjects: client.cancelledProjects ?? 0,
      contractValue: fmtAmount(client.totalContractValue),
      totalPaid: fmtAmount(client.totalPaid),
      paidRatioPercent,
    },
    profile,
    viewAs,
    meta: {
      updatedAtLabel: formatRelativeTime(String(client.updatedAt)),
    },
  };
}
