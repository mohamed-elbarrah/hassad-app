"use client";

import { useState } from "react";
import type { Client } from "@hassad/shared";
import { ClientStatus, BusinessType, UserRole } from "@hassad/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { HandoverModal } from "./HandoverModal";

const STATUS_VARIANT: Record<
  ClientStatus,
  "default" | "secondary" | "destructive"
> = {
  [ClientStatus.LEAD]: "secondary",
  [ClientStatus.ACTIVE]: "default",
  [ClientStatus.STOPPED]: "destructive",
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">معلومات العميل</CardTitle>
          <Badge variant={STATUS_VARIANT[client.status as ClientStatus]}>
            {STATUS_LABELS[client.status as ClientStatus] ?? client.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">اسم الشركة</p>
            <p className="font-medium">{client.companyName}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">اسم المسؤول</p>
            <p className="font-medium">{client.contactName}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">رقم الواتساب</p>
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
          <div>
            <p className="text-muted-foreground mb-1">نوع النشاط</p>
            <p className="font-medium">
              {BUSINESS_TYPE_LABELS[client.businessType as BusinessType] ??
                client.businessType}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">تاريخ الإضافة</p>
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
              <p className="text-muted-foreground mb-1">مدير الحساب</p>
              <p className="font-medium">{client.accountManager}</p>
            </div>
          )}
        </div>

        {canHandover && (
          <div className="pt-2 border-t flex justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={() => setHandoverOpen(true)}
            >
              تسليم للعمليات
            </Button>
          </div>
        )}
      </CardContent>

      {handoverOpen && (
        <HandoverModal
          open={handoverOpen}
          client={{ id: client.id, name: client.companyName }}
          onClose={() => setHandoverOpen(false)}
        />
      )}
    </Card>
  );
}
