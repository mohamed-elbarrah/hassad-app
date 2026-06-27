"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
  MessageCircle,
} from "lucide-react";

import { useAppSelector } from "@/lib/hooks";
import { toast } from "sonner"; // NEW
import {
  useGetPortalRequestsQuery,
  useGetProjectProgressQuery,
  useGetActionItemsQuery,
  useGetActivityFeedQuery,
  useGetCampaignSummaryQuery,
  useSnoozeActionItemMutation,
  useGetTeamMembersQuery,
  // NEW: Missing mutations
  useApproveProjectMutation,
  useRejectDeliverableMutation,
  useApproveDeliverableMutation,
} from "@/features/portal/portalApi";

import { DashboardCard } from "@/components/design-system/DashboardCard";
import { GaugeChart } from "@/components/design-system/GaugeChart";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionItemCard } from "@/components/design-system/ActionItemCard";
import { KpiRow } from "@/components/design-system/KpiRow";
import { TimelineItem } from "@/components/design-system/TimelineItem";
import { mapProjectStatusToUI } from "@/lib/utils/statusMapping";
import { Skeleton } from "@/components/design-system/Skeleton";
import { cn } from "@/lib/utils";

const ACTION_TYPE_CONFIG: Record<
  string,
  {
    primaryAction: string;
    primaryColor: "purple" | "blue";
    icon: typeof Palette;
  }
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
  STRATEGY_REVIEW: {
    primaryAction: "مراجعة الدراسة",
    primaryColor: "purple",
    icon: ClipboardList,
  },
};

const ACTIVITY_ICON_MAP: Record<string, React.ReactNode> = {
  palette: <Palette className="w-6 h-6 text-secondary-500" />,
  file: <FileText className="w-5 h-5 text-secondary-500" />,
  trending: <TrendingUp className="w-6 h-6 text-secondary-500" />,
  check: <CheckCircle className="w-6 h-6 text-secondary-500" />,
  dollar: <DollarSign className="w-6 h-6 text-secondary-500" />,
};

export default function PortalPage() {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const clientId = user?.clientId ?? "";

  const [snoozeActionItem] = useSnoozeActionItemMutation();

  const { data: pendingRequestsData, error: pendingRequestsError } =
    useGetPortalRequestsQuery(
      { page: 1, limit: 3 },
      {
        skip: !clientId,
        pollingInterval: 120_000,
      },
    );
  const { data: projectProgress, error: projectError } =
    useGetProjectProgressQuery(undefined, {
      skip: !clientId,
      pollingInterval: 120_000,
    });
  const { data: actionItemsData, error: actionItemsError } =
    useGetActionItemsQuery(undefined, {
      skip: !clientId,
      pollingInterval: 120_000,
    });
  const { data: activityFeedData, error: activityError } =
    useGetActivityFeedQuery(undefined, {
      skip: !clientId,
      pollingInterval: 120_000,
    });
  const {
    data: campaignSummary,
    error: campaignError,
    isLoading: campaignLoading,
  } = useGetCampaignSummaryQuery(undefined, {
    skip: !clientId,
    pollingInterval: 120_000,
  });
  const { data: teamMembersData } = useGetTeamMembersQuery(undefined, {
    skip: !clientId,
    pollingInterval: 120_000,
  });

  const projects = projectProgress?.projects ?? [];
  const pendingRequests = pendingRequestsData?.data ?? [];
  const gaugeValue = projectProgress?.overallProgress ?? 0;
  const actionItems = actionItemsData?.items ?? [];
  const activityItems = activityFeedData?.items ?? [];

  const handleSnooze = async (item: { id: string; type: string }) => {
    const itemId = item.id.replace(/^(del|inv|prop|con|strat)-/, "");
    try {
      await snoozeActionItem({ itemType: item.type, itemId }).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || "فشل في إخفاء الإجراء");
    }
  };

  if (!clientId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-lg text-portal-note-text">
          لم يتم ربط حسابك بملف عميل. يرجى التواصل مع الإدارة.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      <Link
        href="/portal/chat?openSales=true"
        className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-l from-secondary-50 to-secondary-100/60 border border-secondary-200 hover:from-secondary-100 hover:to-secondary-200 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-500 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-secondary-700">
              هل تحتاج خدمة جديدة؟
            </p>
            <p className="text-xs text-secondary-500/80">
              تواصل مع مدير حسابك عبر المحادثة المباشرة
            </p>
          </div>
        </div>
        <ArrowLeft className="w-4 h-4 text-secondary-400 group-hover:-translate-x-1 transition-transform" />
      </Link>

      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full mx-auto"
        dir="rtl"
      >
      {/* COLUMN 1 */}
      <div className="flex flex-col gap-5">
        {/* ── تتبع المشاريع ──────────────────────────── */}
        <DashboardCard
          title="تتبع المشاريع"
          icon={Activity}
          onShowAll={() => router.push("/portal/projects")}
        >
          {projectError ? (
            <div className="flex flex-col items-center gap-5 py-8">
              <p className="text-base text-portal-note-text">
                تعذر تحميل بيانات المشاريع
              </p>
            </div>
          ) : projectProgress && projects.length > 0 ? (
            <div className="flex flex-col items-center gap-5">
              <GaugeChart value={gaugeValue} max={100} />

              <div className="w-full space-y-3">
                {projects.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 bg-natural-0 border-portal-card-border border rounded-2xl"
                  >
                    <span className="text-base font-medium text-natural-100">
                      {p.name}
                    </span>
                    <StatusBadge
                      status={mapProjectStatusToUI(p.status)}
                      label={p.statusAr}
                    />
                  </div>
                ))}

                <div className="p-5 text-right bg-portal-bg rounded-2xl">
                  <p className="text-base font-medium text-natural-100">
                    المشاريع النشطة :
                  </p>
                  <p className="mt-1 text-sm text-portal-note-text">
                    {projectProgress.activeProjects} من{" "}
                    {projectProgress.totalProjects}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 py-8">
              <GaugeChart value={0} max={100} />
              <p className="text-base text-portal-note-text">
                لا يوجد مشروع نشط حالياً
              </p>
            </div>
          )}
        </DashboardCard>

        {/* ── آخر التحديثات ─────────────────────────── */}
        <DashboardCard title="آخر التحديثات" icon={Clock} showAll={false}>
          {activityError ? (
            <p className="text-base text-portal-note-text text-center py-4">
              تعذر تحميل التحديثات
            </p>
          ) : activityItems.length > 0 ? (
            <div className="space-y-3">
              {activityItems.slice(0, 3).map((item) => {
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
            <p className="text-base text-portal-note-text text-center py-4">
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
            <p className="text-base text-portal-note-text text-center py-4">
              تعذر تحميل الإجراءات
            </p>
          ) : actionItems.length > 0 ? (
            <div className="space-y-3">
              {actionItems.slice(0, 3).map((item) => {
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
            <p className="text-base text-portal-note-text text-center py-4">
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
          {campaignLoading ? (
            <div className="space-y-3 px-1">
              <Skeleton className="h-[30px] w-full rounded-2xl" />
              <Skeleton className="h-[30px] w-full rounded-2xl" />
              <Skeleton className="h-[30px] w-3/4 rounded-2xl" />
            </div>
          ) : campaignError ? (
            <p className="text-base text-portal-note-text text-center py-4">
              تعذر تحميل بيانات الحملة
            </p>
          ) : campaignSummary &&
            (campaignSummary.totalVisits > 0 ||
              campaignSummary.totalConversions > 0) ? (
            <div className="space-y-3">
              <KpiRow
                label="الزيارات"
                value={`${campaignSummary.totalVisits.toLocaleString("ar-SA-u-nu-latn")} زيارة`}
                icon={
                  <Users className="w-[29px] h-[22px] text-secondary-500" />
                }
              />
              <KpiRow
                label="التحويلات"
                value={`${campaignSummary.totalConversions.toLocaleString("ar-SA-u-nu-latn")} تحويل`}
                icon={
                  <Filter className="w-[23px] h-[23px] text-secondary-500" />
                }
              />
              <KpiRow
                label="العائد على الإنفاق الإعلاني"
                value={`${campaignSummary.avgRoas}x`}
                icon={<DollarSign className="w-7 h-7 text-secondary-500" />}
              />

              {campaignSummary.improvementPercent !== 0 && (
                <div
                  className={cn(
                    "p-5 text-right rounded-2xl",
                    campaignSummary.improvementPercent > 0
                      ? "bg-success-100/15"
                      : "bg-danger-100/10",
                  )}
                >
                  <p className="text-base font-medium text-natural-100">
                    ملاحظة:
                  </p>
                  <p className="mt-1 text-sm text-portal-note-text">
                    الأداء{" "}
                    {campaignSummary.improvementPercent > 0 ? "تحسن" : "انخفض"}{" "}
                    بنسبة {Math.abs(campaignSummary.improvementPercent)}% مقارنة
                    بالأسبوع الماضي
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-base text-portal-note-text text-center py-4">
              لا توجد حملات نشطة حالياً
            </p>
          )}
        </DashboardCard>
      </div>

      {/* COLUMN 3 */}
      <div className="flex flex-col gap-5">
        <DashboardCard
          title="الطلبات قيد الانتظار"
          icon={ClipboardList}
          onShowAll={() => router.push("/portal/requests")}
        >
          {pendingRequestsError ? (
            <p className="text-base text-portal-note-text text-center py-4">
              تعذر تحميل الطلبات الحالية
            </p>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-portal-card-border bg-natural-0 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-natural-100 truncate">
                        {request.companyName}
                      </p>
                      <p className="text-sm text-portal-note-text">
                        {request.contactName}
                      </p>
                    </div>
                    <StatusBadge status="pending" label={request.statusLabel} />
                  </div>
                  <p className="mt-3 text-sm text-portal-note-text/90">
                    {request.stageLabel}
                  </p>
                  <p className="mt-2 text-xs text-portal-note-text/80">
                    تاريخ الطلب:{" "}
                    {new Date(request.createdAt).toLocaleDateString(
                      "ar-SA-u-nu-latn",
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base text-portal-note-text text-center py-4">
              لا توجد طلبات بانتظار المتابعة حالياً
            </p>
          )}
        </DashboardCard>
        {/* ── ملخص سريع ────────────────────────────── */}
        {/* <DashboardCard
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
            <p className="text-base text-portal-note-text text-center py-4">
              لا توجد تسليمات حالياً
            </p>
          )}
        </DashboardCard> */}

        {/* ── المسؤولون عن مشروعي ──────────────────────────── */}
        <DashboardCard
          title="المسؤولون عن مشروعي"
          icon={Users}
          showAll={false}
        >
          {teamMembersData?.members && teamMembersData.members.length > 0 ? (
            <div className="space-y-3">
              {teamMembersData.members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-white border-[1.5px] border-portal-card-border rounded-2xl space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-secondary-500 text-white flex items-center justify-center text-lg font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {member.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-natural-100 truncate">
                        {member.name}
                      </h4>
                      <p className="text-sm text-portal-note-text">{member.role}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/portal/chat?userId=${member.id}`)}
                    className="w-full h-12 px-4 flex items-center justify-center gap-2 rounded-xl bg-pm-button-bg text-pm-button-text hover:bg-pm-button-bg/80 transition-colors font-semibold"
                  >
                    <MessageCircle className="w-5 h-5" />
                    تواصل معه
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-badge-gray-bg flex items-center justify-center">
                <Users className="w-8 h-8 text-secondary-500" />
              </div>
              <p className="text-base font-medium text-natural-100 mb-1">
                لم يتم تعيين فريق بعد
              </p>
              <p className="text-sm text-portal-note-text">
                سيظهر فريق العمل المسؤول عن مشروعك هنا
              </p>
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  </div>
  );
}
