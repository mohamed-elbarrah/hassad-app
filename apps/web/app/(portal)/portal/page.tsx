"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import { useGetDeliverablesByClientQuery } from "@/features/deliverables/deliverablesApi";
import { useGetInvoicesByClientQuery } from "@/features/finance/financeApi";
import { useGetCampaignsQuery } from "@/features/campaigns/campaignsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IntakeFormModal } from "@/components/dashboard/crm/IntakeFormModal";

export default function PortalPage() {
  const [showNewDeal, setShowNewDeal] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const { data: deliverables } = useGetDeliverablesByClientQuery(clientId, {
    skip: !clientId,
  });
  const { data: invoices } = useGetInvoicesByClientQuery(clientId, {
    skip: !clientId,
  });
  const { data: campaigns } = useGetCampaignsQuery(
    { clientId, limit: 1 },
    { skip: !clientId },
  );

  const pendingDeliverables = deliverables?.filter(
    (d) => d.status !== "DONE",
  ).length ?? 0;

  const nextInvoice = invoices
    ?.filter((inv) => inv.status === "DUE" || inv.status === "SENT")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const latestCampaign = campaigns?.items?.[0];

  const SUMMARY_CARDS = [
    {
      title: "آخر تسليم معلّق",
      value:
        deliverables === undefined
          ? null
          : deliverables.find((d) => d.status !== "DONE")?.title ?? "لا يوجد",
    },
    {
      title: "حالة الحملة",
      value:
        campaigns === undefined
          ? null
          : latestCampaign
            ? latestCampaign.status === "ACTIVE"
              ? "قيد الإطلاق"
              : latestCampaign.name
            : "لا يوجد",
    },
    {
      title: "الفاتورة القادمة",
      value:
        invoices === undefined
          ? null
          : nextInvoice
            ? new Date(nextInvoice.dueDate).toLocaleDateString("ar-DZ")
            : "لا يوجد",
    },
  ];

  const totalDeliverables = deliverables?.length ?? 0;
  const doneDeliverables = deliverables?.filter((d) => d.status === "DONE").length ?? 0;
  const progress =
    totalDeliverables > 0
      ? Math.round((doneDeliverables / totalDeliverables) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">مرحباً، {user?.name} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            هذه نظرة سريعة على تقدم مشروعك.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setShowNewDeal(true)}
        >
          <Plus className="w-4 h-4" />
          طلب خدمة جديدة
        </Button>
      </div>

      {!clientId && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            لم يتم ربط حسابك بملف عميل. يرجى التواصل مع الإدارة.
          </CardContent>
        </Card>
      )}

      {clientId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تقدم التسليمات</CardTitle>
            </CardHeader>
            <CardContent>
              {deliverables === undefined ? (
                <Skeleton className="h-6 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>
                      {doneDeliverables} من {totalDeliverables} تسليم مكتمل
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SUMMARY_CARDS.map((card) => (
              <Card key={card.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {card.value == null ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    <p className="text-lg font-semibold">{card.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/portal/deliverables">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">التسليمات</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  استعرض الأعمال واعتمدها.
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/proposals">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">العروض الفنية</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  راجع العروض المقدّمة ووافق عليها.
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/contracts">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">العقود</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  استعرض عقودك ووقّع إلكترونياً.
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/reports">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">التقارير</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  تقارير الحملات الإعلانية.
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/finance">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">المالية</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  الفواتير والمدفوعات والعقود.
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}

      {/* New service request modal */}
      {showNewDeal && (
        <IntakeFormModal
          mandatory={false}
          onSuccess={() => setShowNewDeal(false)}
          onClose={() => setShowNewDeal(false)}
        />
      )}
    </div>
  );
}
