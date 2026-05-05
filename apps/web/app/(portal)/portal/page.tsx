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

const ACTION_TYPE_CONFIG: Record<
  string,
  { primaryAction: string; primaryColor: string; icon: typeof Palette }
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
  palette: <Palette style={{ width: 26, height: 26, color: "#121936" }} />,
  file: <FileText style={{ width: 20, height: 23, color: "#121936" }} />,
  trending: <TrendingUp style={{ width: 24, height: 24, color: "#121936" }} />,
  check: <CheckCircle style={{ width: 24, height: 24, color: "#121936" }} />,
  dollar: <DollarSign style={{ width: 28, height: 28, color: "#121936" }} />,
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
        <p style={{ fontSize: 18, color: "rgba(0,0,0,0.6)" }}>
          لم يتم ربط حسابك بملف عميل. يرجى التواصل مع الإدارة.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5"
      dir="rtl"
      style={{
        maxWidth: "100%",
        margin: "0 auto",
      }}
    >
      {/* COLUMN 1 */}
      <div className="flex flex-col gap-5">
        <DashboardCard
          title="الطلبات قيد الانتظار"
          icon={ClipboardList}
          onShowAll={() => router.push("/portal/requests")}
        >
          {pendingRequestsError ? (
            <p
              style={{
                fontSize: 16,
                color: "rgba(0,0,0,0.5)",
                textAlign: "center",
                padding: 16,
              }}
            >
              تعذر تحميل الطلبات الحالية
            </p>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border p-4"
                  style={{ borderColor: "#E1E4EA", background: "#FFFFFF" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="truncate"
                        style={{
                          fontSize: 20,
                          fontWeight: 600,
                          lineHeight: "30px",
                          color: "#000000",
                        }}
                      >
                        {request.companyName}
                      </p>
                      <p
                        style={{
                          fontSize: 15,
                          lineHeight: "22px",
                          color: "rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        {request.contactName}
                      </p>
                    </div>
                    <StatusBadge status="pending" label={request.statusLabel} />
                  </div>
                  <p
                    className="mt-3"
                    style={{
                      fontSize: 15,
                      lineHeight: "24px",
                      color: "rgba(0, 0, 0, 0.7)",
                    }}
                  >
                    {request.stageLabel}
                  </p>
                  <p
                    className="mt-2"
                    style={{
                      fontSize: 14,
                      lineHeight: "21px",
                      color: "rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    تاريخ الطلب:{" "}
                    {new Date(request.createdAt).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: 16,
                color: "rgba(0,0,0,0.5)",
                textAlign: "center",
                padding: 16,
              }}
            >
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
              <p style={{ fontSize: 16, color: "rgba(0,0,0,0.5)" }}>
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
                    className="flex items-center justify-between p-4 bg-white"
                    style={{ border: "1px solid #E1E4EA", borderRadius: 12 }}
                  >
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 500,
                        lineHeight: "33px",
                        color: "#000000",
                      }}
                    >
                      {p.name}
                    </span>
                    <StatusBadge
                      status={mapProjectStatusToUI(p.status)}
                      label={p.statusAr}
                    />
                  </div>
                ))}

                <div
                  className="p-5 text-right"
                  style={{ background: "#F9FAFB", borderRadius: 12 }}
                >
                  <p
                    style={{
                      fontSize: 22,
                      fontWeight: 500,
                      lineHeight: "33px",
                      color: "#000000",
                    }}
                  >
                    المشاريع النشطة :
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontSize: 18,
                      fontWeight: 400,
                      lineHeight: "27px",
                      color: "rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    {projectProgress.activeProjects} من{" "}
                    {projectProgress.totalProjects}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 py-8">
              <GaugeChart value={0} max={100} />
              <p style={{ fontSize: 16, color: "rgba(0,0,0,0.5)" }}>
                لا يوجد مشروع نشط حالياً
              </p>
            </div>
          )}
        </DashboardCard>

        {/* ── آخر التحديثات ─────────────────────────── */}
        <DashboardCard title="آخر التحديثات" icon={Clock} showAll={false}>
          {activityError ? (
            <p
              style={{
                fontSize: 16,
                color: "rgba(0,0,0,0.5)",
                textAlign: "center",
                padding: 16,
              }}
            >
              تعذر تحميل التحديثات
            </p>
          ) : activityItems.length > 0 ? (
            <div className="space-y-3">
              {activityItems.slice(0, 5).map((item) => {
                const dateStr = new Date(item.date).toLocaleDateString(
                  "ar-SA",
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
                        <FileText
                          style={{ width: 20, height: 23, color: "#121936" }}
                        />
                      )
                    }
                  />
                );
              })}
            </div>
          ) : (
            <p
              style={{
                fontSize: 16,
                color: "rgba(0,0,0,0.5)",
                textAlign: "center",
                padding: 16,
              }}
            >
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
            <p
              style={{
                fontSize: 16,
                color: "rgba(0,0,0,0.5)",
                textAlign: "center",
                padding: 16,
              }}
            >
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
                        <config.icon
                          style={{ width: 26, height: 26, color: "#121936" }}
                        />
                      ) : (
                        <Settings
                          style={{ width: 26, height: 26, color: "#121936" }}
                        />
                      )
                    }
                    secondaryAction="ذكرني لاحقًا"
                    primaryAction={config.primaryAction}
                    primaryColor={config.primaryColor as "purple" | "blue"}
                    onPrimary={() => router.push(item.actionUrl)}
                    onSecondary={() => handleSnooze(item)}
                  />
                );
              })}
            </div>
          ) : (
            <p
              style={{
                fontSize: 16,
                color: "rgba(0,0,0,0.5)",
                textAlign: "center",
                padding: 16,
              }}
            >
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
            <p
              style={{
                fontSize: 16,
                color: "rgba(0,0,0,0.5)",
                textAlign: "center",
                padding: 16,
              }}
            >
              تعذر تحميل بيانات الحملة
            </p>
          ) : campaignSummary &&
            (campaignSummary.totalVisits > 0 ||
              campaignSummary.totalConversions > 0) ? (
            <div className="space-y-3">
              <KpiRow
                label="الزيارات"
                value={`${campaignSummary.totalVisits.toLocaleString("ar-SA")} زيارة`}
                icon={
                  <Users style={{ width: 29, height: 22, color: "#121936" }} />
                }
              />
              <KpiRow
                label="التحويلات"
                value={`${campaignSummary.totalConversions.toLocaleString("ar-SA")} تحويل`}
                icon={
                  <Filter style={{ width: 23, height: 23, color: "#121936" }} />
                }
              />
              <KpiRow
                label="العائد على الإنفاق الإعلاني"
                value={`${campaignSummary.avgRoas}x`}
                icon={
                  <DollarSign
                    style={{ width: 28, height: 28, color: "#121936" }}
                  />
                }
              />

              {campaignSummary.improvementPercent !== 0 && (
                <div
                  className="p-5 text-right"
                  style={{
                    background:
                      campaignSummary.improvementPercent > 0
                        ? "rgba(74, 233, 152, 0.15)"
                        : "rgba(239, 68, 68, 0.1)",
                    borderRadius: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 22,
                      fontWeight: 500,
                      lineHeight: "33px",
                      color: "#000000",
                    }}
                  >
                    ملاحظة:
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontSize: 18,
                      fontWeight: 400,
                      lineHeight: "27px",
                      color: "rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    الأداء{" "}
                    {campaignSummary.improvementPercent > 0 ? "تحسن" : "انخفض"}{" "}
                    بنسبة {Math.abs(campaignSummary.improvementPercent)}% مقارنة
                    بالأسبوع الماضي
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p
              style={{
                fontSize: 16,
                color: "rgba(0,0,0,0.5)",
                textAlign: "center",
                padding: 16,
              }}
            >
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
                    date={new Date(d.createdAt).toLocaleDateString("ar-SA", {
                      day: "numeric",
                      month: "short",
                    })}
                    status={uiStatus}
                    statusLabel={statusLabels[uiStatus] ?? d.status}
                  />
                );
              })}
            </div>
          ) : (
            <p
              style={{
                fontSize: 16,
                color: "rgba(0,0,0,0.5)",
                textAlign: "center",
                padding: 16,
              }}
            >
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
