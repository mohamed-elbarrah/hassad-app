"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { ClientStatus, BusinessType } from "@hassad/shared";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { Pill } from "@/components/design-system/Pill";
import { ClientBriefField } from "./ClientBriefField";
import { ClientBriefStatCard } from "./ClientBriefStatCard";
import { formatDate, formatRelativeTime } from "@/lib/format";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  User,
  Calendar,
  Activity,
} from "lucide-react";

interface ClientBriefIdentityProps {
  client: Client;
  profile: ClientProfile | null;
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

export function ClientBriefIdentity({
  client,
  profile,
}: ClientBriefIdentityProps) {
  const statusTone = STATUS_TONE[client.status as ClientStatus] ?? "neutral";
  const statusLabel =
    STATUS_LABELS[client.status as ClientStatus] ?? client.status;

  const logoUrl = profile?.brandAssets?.logoUrl ?? null;
  const subtitle = client.contactName
    ? `المسؤول: ${client.contactName}`
    : (BUSINESS_TYPE_LABELS[client.businessType as BusinessType] ??
      client.businessType);

  const totalProjects =
    (client.activeProjects ?? 0) +
    (client.completedProjects ?? 0) +
    (client.cancelledProjects ?? 0);

  return (
    <div className="space-y-5">
      {/* Identity header card */}
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
          <ClientBriefField
            icon={MapPin}
            label="المنطقة الزمنية"
            value={profile?.timezone}
          />
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
      </section>

      {/* Activity summary */}
      <section className="rounded-2xl border border-portal-card-border bg-natural-0 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-natural-100 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-secondary-500" />
          النشاط
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-portal-note-text">آخر تحديث</span>
            <span className="text-sm font-medium text-natural-100">
              {formatRelativeTime(String(client.updatedAt))}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-success-500"
              style={{
                width: `${Math.min(
                  (client.activeProjects ?? 0) > 0 ? 100 : 0,
                  100,
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-portal-note-text">
            {client.activeProjects ?? 0} مشاريع نشطة من أصل {totalProjects}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <ClientBriefStatCard
            icon={Clock}
            label="وقت الاستجابة"
            value="—"
            colorClass="text-secondary-500"
          />
          <ClientBriefStatCard
            icon={Activity}
            label="إجمالي المشاريع"
            value={totalProjects}
            colorClass="text-success-500"
          />
        </div>
      </section>
    </div>
  );
}
