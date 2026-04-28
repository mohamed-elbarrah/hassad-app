"use client";

import type { Client } from "@hassad/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">بيانات العميل</CardTitle>
        <CardDescription>
          {client.status === ClientStatus.ACTIVE
            ? "بيانات العميل النشط"
            : "بيانات العميل المحتمل"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">اسم الشركة</p>
            <p className="font-medium">{client.companyName}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">اسم النشاط</p>
            <p className="font-medium">{client.businessName}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">نوع النشاط</p>
            <p className="font-medium">
              {BUSINESS_TYPE_LABELS[client.businessType as BusinessType] ??
                client.businessType}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">المسؤول</p>
            <p className="font-medium">{client.contactName}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">واتساب</p>
            <p className="font-medium font-mono" dir="ltr">
              {client.phoneWhatsapp}
            </p>
          </div>
          {client.email && (
            <div>
              <p className="text-muted-foreground mb-1">البريد الإلكتروني</p>
              <p className="font-medium" dir="ltr">
                {client.email}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
