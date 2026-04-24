"use client";

import { useState } from "react";
import type { Client } from "@hassad/shared";
import {
  ClientStatus,
  BusinessType,
  ClientSource,
  PipelineStage,
  UserRole,
} from "@hassad/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { StageSelect } from "./StageSelect";
import { ContactAttemptDialog } from "./ContactAttemptDialog";
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
};

const SOURCE_LABELS: Record<ClientSource, string> = {
  [ClientSource.AD]: "إعلان",
  [ClientSource.REFERRAL]: "إحالة",
  [ClientSource.WEBSITE]: "الموقع الإلكتروني",
  [ClientSource.WHATSAPP]: "واتساب",
  [ClientSource.PLATFORM]: "المنصة",
};

interface ClientInfoCardProps {
  client: Client;
}

export function ClientInfoCard({ client }: ClientInfoCardProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [handoverOpen, setHandoverOpen] = useState(false);

  const canManageSales =
    user?.role === UserRole.ADMIN || user?.role === UserRole.SALES;
  const canHandover =
    canManageSales && client.stage === PipelineStage.CONTRACT_SIGNED;

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
            <p className="text-muted-foreground mb-1">الاسم</p>
            <p className="font-medium">{client.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">الهاتف</p>
            <p className="font-medium font-mono" dir="ltr">
              {client.phone}
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
            <p className="text-muted-foreground mb-1">المصدر</p>
            <p className="font-medium">
              {SOURCE_LABELS[client.source as ClientSource] ?? client.source}
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
        </div>

        <div className="pt-2 border-t">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">مرحلة البيع</p>
            {canManageSales && (
              <div className="flex flex-wrap items-center gap-2">
                <ContactAttemptDialog
                  clientId={client.id}
                  clientName={client.name}
                />
                {canHandover && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setHandoverOpen(true)}
                  >
                    تسليم للعمليات
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="mt-2">
            <StageSelect
              clientId={client.id}
              currentStage={client.stage as PipelineStage}
            />
          </div>
        </div>
      </CardContent>

      {handoverOpen && (
        <HandoverModal
          open={handoverOpen}
          client={{ id: client.id, name: client.name }}
          onClose={() => setHandoverOpen(false)}
        />
      )}
    </Card>
  );
}
