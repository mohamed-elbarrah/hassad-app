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
import { MOCK_MARKETING_DATA, getAggregatedMetrics } from "@/lib/marketing-mock";
import Link from "next/link";

export default function MarketingDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const metrics = getAggregatedMetrics(MOCK_MARKETING_DATA);

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
          value={metrics.totalActiveTasks.toString()} 
          icon={<Zap className="w-4 h-4" />}
          color="bg-indigo-500"
        />
        <SummaryCard 
          title="الحملات النشطة" 
          value={metrics.totalActiveCampaigns.toString()} 
          icon={<Activity className="w-4 h-4" />}
          color="bg-emerald-500"
        />
        <SummaryCard 
          title="إجمالي الإنفاق" 
          value={`$${metrics.totalBudgetUsed.toLocaleString()}`} 
          icon={<Wallet className="w-4 h-4" />}
          color="bg-amber-500"
        />
        <SummaryCard 
          title="متوسط الـ ROAS" 
          value={`${metrics.avgRoas}x`} 
          icon={<Target className="w-4 h-4" />}
          color="bg-rose-500"
        />
      </div>

      {/* Critical Alerts Section */}
      <AlertList tasks={MOCK_MARKETING_DATA} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Progress Overview */}
        <Card className="lg:col-span-2 shadow-sm border-muted/60">
          <CardHeader>
            <CardTitle>نظرة على تقدم المهام</CardTitle>
            <CardDescription>المهام الحالية وحالة الحملات المرتبطة بها</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_MARKETING_DATA.map(task => (
              <Link href={`/dashboard/marketing/tasks/${task.id}`} key={task.id}>
                <div className="group p-4 rounded-xl border border-muted/50 hover:border-primary/40 hover:bg-muted/5 transition-all mb-3 cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${task.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <h4 className="font-bold group-hover:text-primary transition-colors">{task.title}</h4>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{task.client}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        {task.campaigns.length} حملات
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        تاريخ الاستحقاق: {task.dueDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-medium">
                      التفاصيل <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader>
            <CardTitle>آخر النشاطات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { user: "PM", action: "قام بتعديل", target: "مهمة رمضان", time: "قبل ساعة" },
                { user: "System", action: "تحديث المقاييس", target: "Snapchat Ads", time: "قبل ساعتين" },
                { user: "PM", action: "أسند إليك", target: "حملة تيك توك", time: "قبل 5 ساعات" },
              ].map((act, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== 2 && <div className="absolute left-[17px] top-8 bottom-0 w-px bg-muted" />}
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-bold">{act.user}</span> {act.action} <span className="font-medium text-primary">{act.target}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
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
