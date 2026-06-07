"use client";

import type { Client } from "@hassad/shared";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import { BusinessType, ClientStatus } from "@hassad/shared";

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم",
  [BusinessType.CLINIC]: "عيادة",
  [BusinessType.STORE]: "متجر",
  [BusinessType.SERVICE]: "خدمة",
  [BusinessType.OTHER]: "أخرى",
};

interface RequirementsFormProps {
  client: Client;
}

export function RequirementsForm({ client }: RequirementsFormProps) {
  const statusTone =
    client.status === ClientStatus.ACTIVE
      ? "success"
      : client.status === ClientStatus.STOPPED
        ? "danger"
        : "purple";
  const statusLabel =
    client.status === ClientStatus.ACTIVE
      ? "عميل نشط"
      : client.status === ClientStatus.STOPPED
        ? "متوقف"
        : "عميل محتمل";

  return (
    <SurfaceCard
      title="بيانات العميل"
      description={
        client.status === ClientStatus.ACTIVE
          ? "بيانات العميل النشط"
          : "بيانات العميل المحتمل"
      }
      action={<Pill tone={statusTone} className="text-xs h-6 px-2">{statusLabel}</Pill>}
    >
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-neutral-300 mb-1">اسم الشركة</p>
          <p className="font-medium">{client.companyName}</p>
        </div>
        <div>
          <p className="text-neutral-300 mb-1">اسم النشاط</p>
          <p className="font-medium">{client.businessName}</p>
        </div>
        <div>
          <p className="text-neutral-300 mb-1">نوع النشاط</p>
          <p className="font-medium">
            {BUSINESS_TYPE_LABELS[client.businessType as BusinessType] ??
              client.businessType}
          </p>
        </div>
        <div>
          <p className="text-neutral-300 mb-1">المسؤول</p>
          <p className="font-medium">{client.contactName}</p>
        </div>
        <div>
          <p className="text-neutral-300 mb-1">واتساب</p>
          <p className="font-medium font-mono" dir="ltr">
            {client.phoneWhatsapp}
          </p>
        </div>
        {client.email && (
          <div>
            <p className="text-neutral-300 mb-1">البريد الإلكتروني</p>
            <p className="font-medium" dir="ltr">{client.email}</p>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}
