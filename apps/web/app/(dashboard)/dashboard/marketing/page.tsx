"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  ClipboardList,
  Megaphone,
  MousePointerClick,
  Target,
  Wallet,
  Zap,
} from "lucide-react";
import { CampaignStatus, TaskPriority, TaskStatus } from "@hassad/shared";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetMyCampaignStatsQuery } from "@/features/marketing/marketingApi";
import { useGetMyNotificationsQuery } from "@/features/notifications/notificationsApi";
import {
  useGetMyTasksQuery,
  useGetMyTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";
import { notificationPresentation } from "@/lib/i18n";
import { useAppSelector } from "@/lib/hooks";

export default function MarketingDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: tasks = [], isLoading: tasksLoading } = useGetMyTasksQuery(
    { deptName: "MARKETING", includeCampaigns: true },
    { pollingInterval: 30000 },
  );
  const { data: taskStats, isLoading: taskStatsLoading } =
    useGetMyTaskStatsQuery();
  const { data: campaignStats, isLoading: campaignsLoading } =
    useGetMyCampaignStatsQuery(undefined, { pollingInterval: 30000 });
  const { data: notificationsData, isLoading: notificationsLoading } =
    useGetMyNotificationsQuery({ limit: 8 });
  const campaigns = (tasks as any[]).flatMap((task) =>
    (task.campaigns || []).map((campaign: any) => ({ ...campaign, task })),
  );
  const conversions = campaigns.reduce(
    (total, campaign) => total + (campaign.kpiSnapshots?.[0]?.conversions || 0),
    0,
  );
  const urgent = (tasks as any[]).filter(
    (task) =>
      task.status !== TaskStatus.DONE &&
      [TaskPriority.HIGH, TaskPriority.URGENT].includes(task.priority),
  );
  if (
    tasksLoading ||
    taskStatsLoading ||
    campaignsLoading ||
    notificationsLoading
  )
    return <Loading />;
  const metrics = [
    { label: "المهام النشطة", value: taskStats?.inProgress || 0, icon: Zap },
    {
      label: "الحملات النشطة",
      value: campaignStats?.activeCampaigns || 0,
      icon: Activity,
    },
    {
      label: "إجمالي الإنفاق",
      value: formatCurrency(campaignStats?.totalBudgetUsed),
      icon: Wallet,
    },
    {
      label: "متوسط ROAS",
      value:
        campaignStats?.avgRoas != null
          ? `${Number(campaignStats.avgRoas).toFixed(1)}x`
          : "-",
      icon: Target,
    },
    {
      label: "التحويلات",
      value: formatNumber(conversions),
      icon: MousePointerClick,
    },
    {
      label: "مهام متأخرة",
      value: taskStats?.overdue || 0,
      icon: AlertTriangle,
    },
  ];
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
              <Megaphone />
            </div>
            <div>
              <CardTitle className="text-2xl">لوحة تحكم التسويق</CardTitle>
              <CardDescription>
                مرحباً {user?.name}، إليك ملخص أداء حملاتك ومهامك الحالية.
              </CardDescription>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/marketing/tasks">
              <ClipboardList />
              عرض المهام المسندة
            </Link>
          </Button>
        </CardHeader>
      </Card>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold">{item.value}</p>
              </div>
              <item.icon />
            </CardContent>
          </Card>
        ))}
      </section>
      {urgent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>مهام تحتاج متابعة</CardTitle>
            <CardDescription>مهام عالية الأولوية لم تكتمل بعد.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {urgent.slice(0, 4).map((task) => (
              <Button
                key={task.id}
                asChild
                variant="outline"
                className="h-auto justify-between p-3"
              >
                <Link href={`/dashboard/marketing/tasks/${task.id}`}>
                  <span>{task.title}</span>
                  <Badge
                    variant={
                      task.priority === TaskPriority.URGENT
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {task.priority}
                  </Badge>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>أداء الحملات</CardTitle>
              <CardDescription>
                أحدث مؤشرات الحملات المرتبطة بمهامك.
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/marketing/tasks">
                عرض الكل
                <ArrowUpRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <DashboardEmpty
                icon={Megaphone}
                title="لا توجد حملات"
                description="لم يتم إنشاء أي حملة مرتبطة بمهامك بعد."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحملة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإنفاق</TableHead>
                    <TableHead>التحويلات</TableHead>
                    <TableHead>ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.slice(0, 6).map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <Link
                          className="font-medium hover:underline"
                          href={`/dashboard/marketing/tasks/${campaign.task.id}`}
                        >
                          {campaign.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            campaign.status === CampaignStatus.ACTIVE
                              ? "default"
                              : "secondary"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(campaign.budgetSpent)}
                      </TableCell>
                      <TableCell>
                        {campaign.kpiSnapshots?.[0]?.conversions || 0}
                      </TableCell>
                      <TableCell>
                        {campaign.kpiSnapshots?.[0]?.roas || 0}x
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>آخر النشاطات</CardTitle>
          </CardHeader>
          <CardContent>
            {(notificationsData?.data || []).length === 0 ? (
              <DashboardEmpty
                icon={Bell}
                title="لا توجد نشاطات"
                description="ستظهر تحديثات الحملات والمهام هنا."
              />
            ) : (
              <div className="flex flex-col gap-4">
                {(notificationsData?.data || []).map((notification) => {
                  const presentation = notificationPresentation(
                    notification.eventType,
                    notification.metadata,
                  );
                  return (
                  <div key={notification.id} className="flex gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Bell />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {presentation.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {presentation.body}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt as string)}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
function DashboardEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
function Loading() {
  return (
    <main className="flex flex-col gap-6" dir="rtl">
      <Skeleton className="h-32" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </main>
  );
}
