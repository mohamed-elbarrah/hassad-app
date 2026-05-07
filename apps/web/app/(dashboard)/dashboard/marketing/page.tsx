"use client";

import { useAppSelector } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Target, 
  Wallet, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  ClipboardList,
  Activity
} from "lucide-react";
import { AlertList } from "@/components/dashboard/marketing/AlertList";
import { useGetMyTasksQuery } from "@/features/tasks/tasksApi";
import { useGetMyCampaignStatsQuery } from "@/features/marketing/marketingApi";
import { useGetMyNotificationsQuery } from "@/features/notifications/notificationsApi";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import { EmptyState } from "@/components/common/EmptyState";
import Link from "next/link";


export default function MarketingDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: tasks = [], isLoading } = useGetMyTasksQuery(
    { deptName: "MARKETING", includeCampaigns: true },
    { pollingInterval: 30000 },
  );
  const { data: campaignStats, isLoading: statsLoading } = useGetMyCampaignStatsQuery(undefined, { pollingInterval: 30000 });
  const { data: notificationsData, isLoading: notifsLoading } = useGetMyNotificationsQuery({ limit: 10, page: 1 });

  const marketingTasks = tasks;
  const totalActiveTasks = marketingTasks.filter(t => t.status === 'IN_PROGRESS').length;

  if (isLoading || statsLoading) {
    return (
      <div className="flex flex-col gap-8 pb-10" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-8 pb-10" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم التسويق</h1>
          <p className="text-muted-foreground mt-2">
            مرحباً {user?.name}، إليك ملخص المهام والحملات التي تحتاج لمتابعتك.
          </p>
        </div>
        <Link href="/dashboard/marketing/tasks">
          <Button className="gap-2">
            <ClipboardList className="w-4 h-4" />
            عرض المهام المسندة
          </Button>
        </Link>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="المهام النشطة" 
          value={totalActiveTasks.toString()} 
          icon={<Zap className="w-4 h-4" />}
          color="bg-indigo-500"
        />
        <SummaryCard 
          title="الحملات النشطة" 
          value={campaignStats?.activeCampaigns?.toString() ?? "—"} 
          icon={<Activity className="w-4 h-4" />}
          color="bg-emerald-500"
        />
        <SummaryCard 
          title="إجمالي الإنفاق" 
          value={formatCurrency(campaignStats?.totalBudgetUsed)} 
          icon={<Wallet className="w-4 h-4" />}
          color="bg-amber-500"
        />
        <SummaryCard 
          title="متوسط الـ ROAS" 
          value={campaignStats?.avgRoas != null ? `${Number(campaignStats.avgRoas).toFixed(1)}x` : "—x"} 
          icon={<Target className="w-4 h-4" />}
          color="bg-rose-500"
        />
      </div>

      {/* Critical Alerts Section */}
      <AlertList tasks={marketingTasks} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Progress Overview */}
        <Card className="lg:col-span-2 shadow-sm border-muted/60">
          <CardHeader>
            <CardTitle>نظرة على تقدم المهام</CardTitle>
            <CardDescription>المهام الحالية وحالة الحملات المرتبطة بها</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketingTasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="لا توجد مهام تسويقية"
                description="لم يتم إسناد أي مهمة تسويقية إليك بعد."
                actionLabel="عرض كل المهام"
                actionHref="/dashboard/marketing/tasks"
              />
            ) : (
            marketingTasks.map(task => (
              <Link href={`/dashboard/marketing/tasks/${task.id}`} key={task.id}>
                <div className="group p-4 rounded-xl border border-muted/50 hover:border-primary/40 hover:bg-muted/5 transition-all mb-3 cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${task.status === 'IN_PROGRESS' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <h4 className="font-bold group-hover:text-primary transition-colors">{task.title}</h4>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{task.project?.client?.companyName}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        تاريخ الاستحقاق: {formatDate(task.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-medium">
                      التفاصيل <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
            )}
          </CardContent>
        </Card>


        {/* Recent Activity */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader>
            <CardTitle>آخر النشاطات</CardTitle>
          </CardHeader>
          <CardContent>
            {notifsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : notificationsData?.data?.length ? (
              <div className="space-y-6">
                {notificationsData.data.slice(0, 10).map((notif, i) => (
                  <div key={notif.id || i} className="flex gap-3 relative">
                    {i < Math.min(notificationsData.data.length, 10) - 1 && (
                      <div className="absolute left-[17px] top-8 bottom-0 w-px bg-muted" />
                    )}
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{notif.title}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatRelativeTime(notif.createdAt as string)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد نشاطات حديثة
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="overflow-hidden shadow-sm border-muted/60">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl text-white ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
