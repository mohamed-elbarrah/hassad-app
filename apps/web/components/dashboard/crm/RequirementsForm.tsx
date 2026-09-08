"use client";

import type { Client } from "@hassad/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      : client.status === ClientStatus.SUSPENDED
        ? "danger"
        : "purple";
  const statusLabel =
    client.status === ClientStatus.ACTIVE
      ? "عميل نشط"
      : client.status === ClientStatus.SUSPENDED
        ? "متوقف"
        : "عميل محتمل";

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex min-w-0 flex-col gap-1.5">
          <CardTitle className="text-base">بيانات العميل</CardTitle>
          <CardDescription>
            {client.status === ClientStatus.ACTIVE
              ? "بيانات العميل النشط"
              : "بيانات العميل المحتمل"}
          </CardDescription>
        </div>
        <Pill tone={statusTone} className="h-6 px-2 text-xs">
          {statusLabel}
        </Pill>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-1 text-muted-foreground">اسم الشركة</p>
          <p className="font-medium">{client.companyName}</p>
        </div>
        <div>
          <p className="mb-1 text-muted-foreground">اسم النشاط</p>
          <p className="font-medium">{client.businessName}</p>
        </div>
        <div>
          <p className="mb-1 text-muted-foreground">نوع النشاط</p>
          <p className="font-medium">
            {BUSINESS_TYPE_LABELS[client.businessType as BusinessType] ??
              client.businessType}
          </p>
        </div>
        <div>
          <p className="mb-1 text-muted-foreground">المسؤول</p>
          <p className="font-medium">{client.user?.name ?? "—"}</p>
        </div>
        <div>
          <p className="mb-1 text-muted-foreground">واتساب</p>
          <p className="font-medium font-mono" dir="ltr">
            {client.user?.phoneWhatsapp ?? "—"}
          </p>
        </div>
        {client.user?.email && (
          <div>
            <p className="mb-1 text-muted-foreground">البريد الإلكتروني</p>
            <p className="font-medium" dir="ltr">
              {client.user.email}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
