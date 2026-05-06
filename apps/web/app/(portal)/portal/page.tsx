"use client";

import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Settings,
  TrendingUp,
  Users,
  Filter,
  DollarSign,
  Palette,
  FileText,
  Clock,
  Activity,
  Receipt,
  CheckCircle,
  PenTool,
} from "lucide-react";

import { useAppSelector } from "@/lib/hooks";
import { useGetDeliverablesByClientQuery } from "@/features/deliverables/deliverablesApi";
import {
  useGetPortalRequestsQuery,
  useGetProjectProgressQuery,
  useGetActionItemsQuery,
  useGetActivityFeedQuery,
  useGetCampaignSummaryQuery,
  useSnoozeActionItemMutation,
} from "@/features/portal/portalApi";

import { DashboardCard } from "@/components/portal/DashboardCard";
import { GaugeChart } from "@/components/portal/GaugeChart";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { ActionItemCard } from "@/components/portal/ActionItemCard";
import { KpiRow } from "@/components/portal/KpiRow";
import { TimelineItem } from "@/components/portal/TimelineItem";
import { DeliverableItem } from "@/components/portal/DeliverableItem";
import { PmCard } from "@/components/portal/PmCard";
import {
  mapTaskStatusToUI,
  mapProjectStatusToUI,
} from "@/lib/utils/statusMapping";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACTION_TYPE_CONFIG: Record<
  string,
  { primaryAction: string; primaryColor: "purple" | "blue"; icon: typeof Palette }
> = {
  DELIVERABLE_APPROVAL: {
    primaryAction: "مراجعة الآن",
    primaryColor: "purple",
    icon: Palette,
  },
  INVOICE_PAYMENT: {
    primaryAction: "أدفع الان",
    primaryColor: "blue",
    icon: Receipt,
  },
  PROPOSAL_REVIEW: {
    primaryAction: "مراجعة العرض",
    primaryColor: "purple",
    icon: FileText,
  },
  CONTRACT_SIGN: {
    primaryAction: "توقيع العقد",
    primaryColor: "blue",
    icon: PenTool,
  },
};

const ACTIVITY_ICON_MAP: Record<string, React.ReactNode> = {
  palette: <Palette className="w-[26px] h-[26px] text-secondary-500" />,
  file: <FileText className="w-5 h-[23px] text-secondary-500" />,
  trending: <TrendingUp className="w-6 h-6 text-secondary-500" />,
  check: <CheckCircle className="w-6 h-6 text-secondary-500" />,
  dollar: <DollarSign className="w-7 h-7 text-secondary-500" />,
};

export default function PortalPage() {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const clientId = user?.clientId ?? "";

  const [snoozeActionItem] = useSnoozeActionItemMutation();

  const { data: deliverables } = useGetDeliverablesByClientQuery(clientId, {
    skip: !clientId,
  });
  const { data: pendingRequestsData, error: pendingRequestsError } =
    useGetPortalRequestsQuery(
      { page: 1, limit: 3 },
      {
        skip: !clientId,
      },
    );
  const { data: projectProgress, error: projectError } =
    useGetProjectProgressQuery(undefined, {
      skip: !clientId,
    });
  const { data: actionItemsData, error: actionItemsError } =
    useGetActionItemsQuery(undefined, {
      skip: !clientId,
    });
  const { data: activityFeedData, error: activityError } =
    useGetActivityFeedQuery(undefined, {
      skip: !clientId,
    });
  const { data: campaignSummary, error: campaignError } =
    useGetCampaignSummaryQuery(undefined, {
      skip: !clientId,
    });

  const projects = projectProgress?.projects ?? [];
  const pendingRequests = pendingRequestsData?.data ?? [];
  const gaugeValue = projectProgress?.overallProgress ?? 0;
  const actionItems = actionItemsData?.items ?? [];
  const activityItems = activityFeedData?.items ?? [];

  const totalDeliverables = deliverables?.length ?? 0;

  const activePm =
    projects.find((p) => p.status === "ACTIVE")?.projectManager ??
    projects[0]?.projectManager ??
    null;

  const handleSnooze = async (item: { id: string; type: string }) => {
    const itemId = item.id.replace(/^(del|inv|prop|con)-/, "");
    try {
      await snoozeActionItem({ itemType: item.type, itemId }).unwrap();
    } catch {
      // Silent fail — item will reappear on next fetch
    }
  };

  if (!clientId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-[18px] text-portal-note-text">
          لم يتم ربط حسابك بملف عميل. يرجى التواصل مع الإدارة.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full mx-auto"
      dir="rtl"
    >
      {/* COLUMN 1 */}
      <div className="flex flex-col gap-5">
        <DashboardCard
          title="الطلبات قيد الانتظار"
          icon={ClipboardList}
          onShowAll={() => router.push("/portal/requests")}
        >
          {pendingRequestsError ? (
            <p className="text-[16px] text-portal-note-text text-center py-4">
              تعذر تحميل الطلبات الحالية
            </p>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <Card
                  key={request.id}
                  className="rounded-2xl border-portal-card-border p-4 bg-white shadow-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[20px] font-semibold leading-[30px] text-natural-100 truncate">
                        {request.companyName}
                      </p>
                      <p className="text-[15px] leading-[22px] text-portal-note-text">
                        {request.contactName}
                      </p>
                    </div>
                    <StatusBadge status="pending" label={request.statusLabel} />
                  </div>
                  <p className="mt-3 text-[15px] leading-[24px] text-portal-note-text/90">
                    {request.stageLabel}
                  </p>
                  <p className="mt-2 text-[14px] leading-[21px] text-portal-note-text/80">
                    تاريخ الطلب:{" "}
                    {new Date(request.createdAt).toLocaleDateString(
                      "ar-SA-u-nu-latn",
                    )}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-[16px] text-portal-note-text text-center py-4">
              لا توجد طلبات بانتظار المتابعة حالياً
            </p>
          )}
        </DashboardCard>

        {/* ── تتبع المشاريع ──────────────────────────── */}
        <DashboardCard
          title="تتبع المشاريع"
          icon={Activity}
          onShowAll={() => router.push("/portal/projects")}
        >
          {projectError ? (
            <div className="flex flex-col items-center gap-5 py-8">
              <p className="text-[16px] text-portal-note-text">
                تعذر تحميل بيانات المشاريع
              </p>
            </div>
          ) : projectProgress && projects.length > 0 ? (
            <div className="flex flex-col items-center gap-5">
              <GaugeChart value={gaugeValue} max={100} />

              <div className="w-full space-y-3">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 bg-white border-portal-card-border border rounded-xl"
                  >
                    <span className="text-[22px] font-medium leading-[33px] text-natural-100">
                      {p.name}
                    </span>
                    <StatusBadge
                      status={mapProjectStatusToUI(p.status)}
                      label={p.statusAr}
                    />
                  </div>
                ))}

                <div className="p-5 text-right bg-portal-bg rounded-xl">
                  <p className="text-[22px] font-medium leading-[33px] text-natural-100">
                    المشاريع النشطة :
                  </p>
                  <p className="mt-1 text-[18px] font-normal leading-[27px] text-portal-note-text">
                    {projectProgress.activeProjects} من{" "}
                    {projectProgress.totalProjects}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 py-8">
              <GaugeChart value={0} max={100} />
              <p className="text-[16px] text-portal-note-text">
                لا يوجد مشروع نشط حالياً
              </p>
            </div>
          )}
        </DashboardCard>

        {/* ── آخر التحديثات ─────────────────────────── */}
        <DashboardCard title="آخر التحديثات" icon={Clock} showAll={false}>
          {activityError ? (
            <p className="text-[16px] text-portal-note-text text-center py-4">
              تعذر تحميل التحديثات
            </p>
          ) : activityItems.length > 0 ? (
            <div className="space-y-3">
              {activityItems.slice(0, 5).map((item) => {
                const dateStr = new Date(item.date).toLocaleDateString(
                  "ar-SA-u-nu-latn",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  },
                );
                return (
                  <TimelineItem
                    key={item.id}
                    date={dateStr}
                    text={item.text}
                    icon={
                      ACTIVITY_ICON_MAP[item.icon] ?? (
                        <FileText className="w-5 h-[23px] text-secondary-500" />
                      )
                    }
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-[16px] text-portal-note-text text-center py-4">
              لا توجد تحديثات حالياً
            </p>
          )}
        </DashboardCard>
      </div>

      {/* COLUMN 2 */}
      <div className="flex flex-col gap-5">
        {/* ── إجراءات تحتاج تدخلك ─────────────────── */}
        <DashboardCard
          title="إجراءات تحتاج تدخلك"
          icon={Settings}
          onShowAll={() => router.push("/portal/actions")}
        >
          {actionItemsError ? (
            <p className="text-[16px] text-portal-note-text text-center py-4">
              تعذر تحميل الإجراءات
            </p>
          ) : actionItems.length > 0 ? (
            <div className="space-y-3">
              {actionItems.slice(0, 4).map((item) => {
                const config =
                  ACTION_TYPE_CONFIG[item.type] ??
                  ACTION_TYPE_CONFIG.DELIVERABLE_APPROVAL;
                return (
                  <ActionItemCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    icon={
                      config.icon ? (
                        <config.icon className="w-[26px] h-[26px] text-secondary-500" />
                      ) : (
                        <Settings className="w-[26px] h-[26px] text-secondary-500" />
                      )
                    }
                    secondaryAction="ذكرني لاحقًا"
                    primaryAction={config.primaryAction}
                    primaryColor={config.primaryColor}
                    onPrimary={() => router.push(item.actionUrl)}
                    onSecondary={() => handleSnooze(item)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-[16px] text-portal-note-text text-center py-4">
              لا توجد إجراءات معلقة
            </p>
          )}
        </DashboardCard>

        {/* ── أداء الحملة ───────────────────────────── */}
        <DashboardCard
          title="أداء الحملة"
          icon={TrendingUp}
          onShowAll={() => router.push("/portal/campaigns")}
        >
          {campaignError ? (
            <p className="text-[16px] text-portal-note-text text-center py-4">
              تعذر تحميل بيانات الحملة
            </p>
          ) : campaignSummary &&
            (campaignSummary.totalVisits > 0 ||
              campaignSummary.totalConversions > 0) ? (
            <div className="space-y-3">
              <KpiRow
                label="الزيارات"
                value={`${campaignSummary.totalVisits.toLocaleString("ar-SA-u-nu-latn")} زيارة`}
                icon={<Users className="w-[29px] h-[22px] text-secondary-500" />}
              />
              <KpiRow
                label="التحويلات"
                value={`${campaignSummary.totalConversions.toLocaleString("ar-SA-u-nu-latn")} تحويل`}
                icon={<Filter className="w-[23px] h-[23px] text-secondary-500" />}
              />
              <KpiRow
                label="العائد على الإنفاق الإعلاني"
                value={`${campaignSummary.avgRoas}x`}
                icon={<DollarSign className="w-7 h-7 text-secondary-500" />}
              />

              {campaignSummary.improvementPercent !== 0 && (
                <div
                  className={cn(
                    "p-5 text-right rounded-xl",
                    campaignSummary.improvementPercent > 0
                      ? "bg-success-100/15"
                      : "bg-danger-100/10"
                  )}
                >
                  <p className="text-[22px] font-medium leading-[33px] text-natural-100">
                    ملاحظة:
                  </p>
                  <p className="mt-1 text-[18px] font-normal leading-[27px] text-portal-note-text">
                    الأداء{" "}
                    {campaignSummary.improvementPercent > 0 ? "تحسن" : "انخفض"}{" "}
                    بنسبة {Math.abs(campaignSummary.improvementPercent)}% مقارنة
                    بالأسبوع الماضي
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[16px] text-portal-note-text text-center py-4">
              لا توجد حملات نشطة حالياً
            </p>
          )}
        </DashboardCard>
      </div>

      {/* COLUMN 3 */}
      <div className="flex flex-col gap-5">
        {/* ── ملخص سريع ────────────────────────────── */}
        <DashboardCard
          title="ملخص سريع"
          icon={ClipboardList}
          onShowAll={() => router.push("/portal/deliverables")}
        >
          {totalDeliverables > 0 && deliverables ? (
            <div className="space-y-3">
              {deliverables.slice(0, 4).map((d) => {
                const uiStatus = mapTaskStatusToUI(d.status);
                const statusLabels: Record<string, string> = {
                  completed: "تم التسليم",
                  "in-progress": "نشط",
                  "not-started": "معلق",
                  pending: "قادمة",
                  revision: "تعديل",
                };
                return (
                  <DeliverableItem
                    key={d.id}
                    title={d.title}
                    description={d.description ?? ""}
                    date={new Date(d.createdAt).toLocaleDateString(
                      "ar-SA-u-nu-latn",
                      {
                        day: "numeric",
                        month: "short",
                      },
                    )}
                    status={uiStatus}
                    statusLabel={statusLabels[uiStatus] ?? d.status}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-[16px] text-portal-note-text text-center py-4">
              لا توجد تسليمات حالياً
            </p>
          )}
        </DashboardCard>

        {/* ── مدير المشروع ──────────────────────────── */}
        <DashboardCard
          title="مدير المشروع"
          icon={ClipboardList}
          showAll={false}
        >
          <PmCard
            name={activePm?.name ?? "غير معين"}
            role="مدير المشروع المسؤول"
            status={activePm?.isOnline ? "online" : "offline"}
          />
        </DashboardCard>
      </div>
    </div>
  );
}
