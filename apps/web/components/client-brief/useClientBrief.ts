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
 */

"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { ClientStatus, BusinessType } from "@hassad/shared";
import type { PillTone } from "@/components/design-system/Pill";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";

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
  viewAs?: ClientBriefView;
}

export function useClientBrief({
  client,
  profile,
  viewAs = "internal",
}: UseClientBriefOptions): ClientBriefViewModel {
  const status = client.status as ClientStatus;
  const statusTone = STATUS_TONE[status] ?? "neutral";
  const statusLabel = STATUS_LABELS[status] ?? client.status;

  const businessType = client.businessType as BusinessType;
  const businessTypeLabel =
    BUSINESS_TYPE_LABELS[businessType] ?? client.businessType;

  // -----------------------------------------------------------------
  // Unified contact data: prefer the client's own profile wizard data
  // when available so the identity sidebar and Communication section
  // never show conflicting names/phones/business names.
  // CRM data (client.*) is kept as the fallback and for internal fields
  // such as account manager and creation date.
  // -----------------------------------------------------------------
  const communication = profile?.communicationInfo;
  const displayBusinessName = communication?.businessName || client.companyName;
  const displayContactName = communication?.contactName || client.contactName;
  const displayPhone = communication?.contactNumber || client.phoneWhatsapp;
  const displayEmail = communication?.email || client.email;
  const displayIndustry = communication?.industry;

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
      contractValue: formatCurrency(client.totalContractValue),
      totalPaid: formatCurrency(client.totalPaid),
      paidRatioPercent,
    },
    profile,
    viewAs,
    meta: {
      updatedAtLabel: formatRelativeTime(String(client.updatedAt)),
    },
  };
}
