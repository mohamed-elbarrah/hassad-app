"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Filter,
  MessageCircle,
  Palette,
  PenTool,
  Receipt,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { formatNumber, formatPortalDate } from "@/lib/format";
import {
  portalActionSubtitle,
  portalActionTitle,
  portalActivityText,
  portalErrorMessage,
  portalProjectStatusLabel,
  portalRequestStageLabel,
  portalRequestStatusLabel,
  portalTeamRoleLabel,
} from "@/lib/i18n";
import { useAppSelector } from "@/lib/hooks";
import { useSnoozeActionItem } from "@/hooks/useSnoozeActionItem";
import {
  useGetActionItemsQuery,
  useGetActivityFeedQuery,
  useGetCampaignSummaryQuery,
  useGetPortalRequestsQuery,
  useGetProjectProgressQuery,
  useGetTeamMembersQuery,
} from "@/features/portal/portalApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_TYPE_CONFIG: Record<
  string,
  { primaryAction: string; variant: "default" | "secondary"; icon: LucideIcon }
> = {
  DELIVERABLE_APPROVAL: {
    primaryAction: "مراجعة الآن",
    variant: "default",
    icon: Palette,
  },
  INVOICE_PAYMENT: {
    primaryAction: "أدفع الآن",
    variant: "secondary",
    icon: Receipt,
  },
  PROPOSAL_REVIEW: {
    primaryAction: "مراجعة العرض",
    variant: "default",
    icon: FileText,
  },
  CONTRACT_SIGN: {
    primaryAction: "توقيع العقد",
    variant: "secondary",
    icon: PenTool,
  },
  STRATEGY_REVIEW: {
    primaryAction: "مراجعة الدراسة",
    variant: "default",
    icon: ClipboardList,
  },
};

const ACTIVITY_ICON_MAP: Record<string, LucideIcon> = {
  palette: Palette,
  file: FileText,
  trending: TrendingUp,
  check: CheckCircle,
  dollar: DollarSign,
};

function DashboardSection({
  title,
  icon: Icon,
  actionHref,
  children,
}: {
  title: string;
  icon: LucideIcon;
  actionHref?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon className="size-5 text-muted-foreground" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {actionHref ? (
            <Button asChild variant="outline" size="sm">
              <Link href={actionHref}>عرض الكل</Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

function SectionEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
    </Empty>
  );
}

function ProjectStatusBadge({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  const variant =
    status === "CANCELLED"
      ? "destructive"
      : status === "ACTIVE" || status === "COMPLETED"
        ? "default"
        : "secondary";

  return <Badge variant={variant}>{label}</Badge>;
}

export default function PortalPage() {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const clientId = user?.clientId ?? "";
  const { snoozeItem } = useSnoozeActionItem();

  const {
    data: pendingRequestsData,
    error: pendingRequestsError,
    isLoading: pendingRequestsLoading,
  } = useGetPortalRequestsQuery(
    { page: 1, limit: 3 },
    { skip: !clientId, pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );
  const {
    data: projectProgress,
    error: projectError,
    isLoading: projectsLoading,
  } = useGetProjectProgressQuery(undefined, {
    skip: !clientId,
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });
  const {
    data: actionItemsData,
    error: actionItemsError,
    isLoading: actionItemsLoading,
  } = useGetActionItemsQuery(undefined, {
    skip: !clientId,
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });
  const {
    data: activityFeedData,
    error: activityError,
    isLoading: activityLoading,
  } = useGetActivityFeedQuery(undefined, {
    skip: !clientId,
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });
  const {
    data: campaignSummary,
    error: campaignError,
    isLoading: campaignLoading,
  } = useGetCampaignSummaryQuery(undefined, {
    skip: !clientId,
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });
  const {
    data: teamMembersData,
    error: teamMembersError,
    isLoading: teamMembersLoading,
  } = useGetTeamMembersQuery(undefined, {
    skip: !clientId,
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });

  const projects = projectProgress?.projects ?? [];
  const pendingRequests = pendingRequestsData?.data ?? [];
  const actionItems = actionItemsData?.items ?? [];
  const activityItems = activityFeedData?.items ?? [];

  if (!clientId) {
    return (
      <main dir="rtl">
        <Card>
          <CardContent className="pt-6">
            <SectionEmpty
              icon={Users}
              title="حساب العميل غير مرتبط"
              description="يرجى التواصل مع الإدارة لربط حسابك بملف العميل."
            />
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-6">
          <Button
            asChild
            variant="ghost"
            className="h-auto w-full justify-between"
          >
            <Link href="/portal/chat?openSales=true">
              <span className="flex items-center gap-3 text-right">
                <MessageCircle className="size-5" />
                <span className="flex flex-col gap-1">
                  <span className="font-semibold">هل تحتاج خدمة جديدة؟</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    تواصل مع مدير حسابك عبر المحادثة المباشرة
                  </span>
                </span>
              </span>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6">
          <DashboardSection
            title="تتبع المشاريع"
            icon={Activity}
            actionHref="/portal/projects"
          >
            {projectsLoading ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : projectError ? (
              <SectionEmpty
                icon={Activity}
                title={portalErrorMessage(projectError)}
              />
            ) : projects.length ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl font-semibold">
                    {projectProgress?.overallProgress ?? 0}%
                  </span>
                  <Progress value={projectProgress?.overallProgress ?? 0} />
                  <CardDescription>نسبة الإنجاز الإجمالية</CardDescription>
                </div>
                {projects.slice(0, 3).map((project) => (
                  <Card key={project.id}>
                    <CardContent className="flex items-center justify-between gap-3 pt-6">
                      <span className="font-medium">{project.name}</span>
                      <ProjectStatusBadge
                        label={portalProjectStatusLabel(project.status)}
                        status={project.status}
                      />
                    </CardContent>
                  </Card>
                ))}
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="font-medium">المشاريع النشطة</p>
                    <p className="text-sm text-muted-foreground">
                      {projectProgress?.activeProjects} من{" "}
                      {projectProgress?.totalProjects}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <SectionEmpty icon={Activity} title="لا يوجد مشروع نشط حالياً" />
            )}
          </DashboardSection>

          <DashboardSection title="آخر التحديثات" icon={Clock}>
            {activityLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : activityError ? (
              <SectionEmpty
                icon={Clock}
                title={portalErrorMessage(activityError)}
              />
            ) : activityItems.length ? (
              <div className="flex flex-col gap-3">
                {activityItems.slice(0, 3).map((item) => {
                  const Icon = ACTIVITY_ICON_MAP[item.icon] ?? FileText;
                  const date = formatPortalDate(item.date) ?? "—";
                  return (
                    <Card key={item.id}>
                      <CardContent className="flex items-center gap-3 pt-6">
                        <Avatar>
                          <AvatarFallback>
                            <Icon className="size-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {portalActivityText(item)}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <CalendarDays className="size-3" />
                            {date}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <SectionEmpty icon={Clock} title="لا توجد تحديثات حالياً" />
            )}
          </DashboardSection>
        </div>

        <div className="flex flex-col gap-6">
          <DashboardSection
            title="إجراءات تحتاج تدخلك"
            icon={Settings}
            actionHref="/portal/actions"
          >
            {actionItemsLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-44 w-full" />
                <Skeleton className="h-44 w-full" />
              </div>
            ) : actionItemsError ? (
              <SectionEmpty
                icon={Settings}
                title={portalErrorMessage(actionItemsError)}
              />
            ) : actionItems.length ? (
              <div className="flex flex-col gap-3">
                {actionItems.slice(0, 3).map((item) => {
                  const config =
                    ACTION_TYPE_CONFIG[item.type] ??
                    ACTION_TYPE_CONFIG.DELIVERABLE_APPROVAL;
                  const Icon = config.icon;
                  return (
                    <Card key={item.id}>
                      <CardContent className="flex flex-col gap-4 pt-6">
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback>
                              <Icon className="size-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium">
                              {portalActionTitle(item)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {portalActionSubtitle(item)}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            onClick={() => snoozeItem(item.type, item.id)}
                          >
                            ذكرني لاحقاً
                          </Button>
                          <Button
                            variant={config.variant}
                            onClick={() => router.push(item.actionUrl)}
                          >
                            {config.primaryAction}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <SectionEmpty icon={Settings} title="لا توجد إجراءات معلقة" />
            )}
          </DashboardSection>

          <DashboardSection
            title="أداء الحملة"
            icon={TrendingUp}
            actionHref="/portal/campaigns"
          >
            {campaignLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : campaignError ? (
              <SectionEmpty
                icon={TrendingUp}
                title={portalErrorMessage(campaignError)}
              />
            ) : campaignSummary &&
              (campaignSummary.totalVisits > 0 ||
                campaignSummary.totalConversions > 0) ? (
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "الزيارات",
                    value: `${formatNumber(campaignSummary.totalVisits)} زيارة`,
                    icon: Users,
                  },
                  {
                    label: "التحويلات",
                    value: `${formatNumber(campaignSummary.totalConversions)} تحويل`,
                    icon: Filter,
                  },
                  {
                    label: "العائد على الإنفاق الإعلاني",
                    value: `${campaignSummary.avgRoas}x`,
                    icon: DollarSign,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <Card key={label}>
                    <CardContent className="flex items-start justify-between gap-3 pt-6">
                      <div>
                        <CardDescription>{label}</CardDescription>
                        <p className="mt-2 text-2xl font-semibold">{value}</p>
                      </div>
                      <Icon className="size-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
                {campaignSummary.improvementPercent !== 0 ? (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <p className="font-medium">ملاحظة</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        الأداء{" "}
                        {campaignSummary.improvementPercent > 0
                          ? "تحسن"
                          : "انخفض"}{" "}
                        بنسبة {Math.abs(campaignSummary.improvementPercent)}%
                        مقارنة بالأسبوع الماضي
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : (
              <SectionEmpty
                icon={TrendingUp}
                title="لا توجد حملات نشطة حالياً"
              />
            )}
          </DashboardSection>
        </div>

        <div className="flex flex-col gap-6">
          <DashboardSection
            title="الطلبات قيد الانتظار"
            icon={ClipboardList}
            actionHref="/portal/requests"
          >
            {pendingRequestsLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : pendingRequestsError ? (
              <SectionEmpty
                icon={ClipboardList}
                title={portalErrorMessage(pendingRequestsError)}
              />
            ) : pendingRequests.length ? (
              <div className="flex flex-col gap-3">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {request.companyName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.contactName}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {portalRequestStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {portalRequestStageLabel(request.stage)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        تاريخ الطلب:{" "}
                        {formatPortalDate(request.createdAt) ?? "—"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <SectionEmpty
                icon={ClipboardList}
                title="لا توجد طلبات بانتظار المتابعة حالياً"
              />
            )}
          </DashboardSection>

          <DashboardSection title="المسؤولون عن مشروعي" icon={Users}>
            {teamMembersLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : teamMembersError ? (
              <SectionEmpty
                icon={Users}
                title={portalErrorMessage(teamMembersError)}
              />
            ) : teamMembersData?.members?.length ? (
              <div className="flex flex-col gap-3">
                {teamMembersData.members.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="flex flex-col gap-4 pt-6">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={member.avatarUrl}
                            alt={member.name}
                          />
                          <AvatarFallback>
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {member.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {portalTeamRoleLabel(member.roleCode)}
                          </p>
                        </div>
                        {member.isOnline ? <Badge>متصل</Badge> : null}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          router.push(`/portal/chat?userId=${member.id}`)
                        }
                      >
                        <MessageCircle />
                        تواصل معه
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <SectionEmpty
                icon={Users}
                title="لم يتم تعيين فريق بعد"
                description="سيظهر فريق العمل المسؤول عن مشروعك هنا."
              />
            )}
          </DashboardSection>
        </div>
      </div>
    </main>
  );
}
