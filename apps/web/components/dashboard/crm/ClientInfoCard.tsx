"use client";

import { useState } from "react";
import type { Client } from "@hassad/shared";
import { ClientStatus, BusinessType, UserRole } from "@hassad/shared";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { useAppSelector } from "@/lib/hooks";
import { HandoverModal } from "./HandoverModal";

const STATUS_TONE: Record<ClientStatus, import("@/components/design-system/Pill").PillTone> = {
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

interface ClientInfoCardProps {
  client: Client;
}

export function ClientInfoCard({ client }: ClientInfoCardProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [handoverOpen, setHandoverOpen] = useState(false);

  const canManageSales =
    user?.role === UserRole.ADMIN || user?.role === UserRole.SALES;
  const canHandover = canManageSales && client.status === ClientStatus.ACTIVE;

  const tone = STATUS_TONE[client.status as ClientStatus] ?? "neutral";
  const statusLabel = STATUS_LABELS[client.status as ClientStatus] ?? client.status;

  return (
    <SurfaceCard
      title="معلومات العميل"
      action={
        <Pill tone={tone} className="text-xs h-6 px-2">
          {statusLabel}
        </Pill>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-300 mb-1">اسم الشركة</p>
            <p className="font-medium">{client.companyName}</p>
          </div>
          <div>
            <p className="text-neutral-300 mb-1">اسم المسؤول</p>
            <p className="font-medium">{client.contactName}</p>
          </div>
          <div>
            <p className="text-neutral-300 mb-1">رقم الواتساب</p>
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
          <div>
            <p className="text-neutral-300 mb-1">نوع النشاط</p>
            <p className="font-medium">
              {BUSINESS_TYPE_LABELS[client.businessType as BusinessType] ??
                client.businessType}
            </p>
          </div>
          <div>
            <p className="text-neutral-300 mb-1">تاريخ الإضافة</p>
            <p className="font-medium" dir="ltr">
              {new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                numberingSystem: "latn",
              }).format(new Date(client.createdAt))}
            </p>
          </div>
          {client.accountManager && (
            <div>
              <p className="text-neutral-300 mb-1">مدير الحساب</p>
              <p className="font-medium">{client.accountManager}</p>
            </div>
          )}
        </div>

        {canHandover && (
          <div className="pt-2 border-t flex justify-end">
            <ActionButton
              size="sm"
              variant="primary"
              onClick={() => setHandoverOpen(true)}
            >
              تسليم للعمليات
            </ActionButton>
          </div>
        )}
      </div>

      {handoverOpen && (
        <HandoverModal
          open={handoverOpen}
          client={{ id: client.id, name: client.companyName }}
          onClose={() => setHandoverOpen(false)}
        />
      )}
    </SurfaceCard>
  );
}
