"use client";

import { useState, use } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Target, 
  BarChart3, 
  Info, 
  Layout, 
  Settings2, 
  AlertCircle,
  TrendingUp,
  MousePointerClick,
  ArrowRight
} from "lucide-react";
import { MOCK_MARKETING_DATA, Campaign, computeMetrics } from "@/lib/marketing-mock";
import { CampaignDetailDrawer } from "@/components/dashboard/marketing/CampaignDetailDrawer";
import { CampaignFormModal } from "@/components/dashboard/marketing/CampaignFormModal";
import { useGetTaskByIdQuery, TaskWithProject } from "@/features/tasks/tasksApi";
import { useGetCampaignsByTaskQuery } from "@/features/marketing/marketingApi";
import Link from "next/link";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingTaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  
  const { data: rawTask, isLoading: isTaskLoading } = useGetTaskByIdQuery(taskId);
  const task = rawTask as unknown as TaskWithProject;
  const { data: campaigns = [], isLoading: isCampaignsLoading } = useGetCampaignsByTaskQuery(taskId);


  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isTaskLoading) return (
    <div className="space-y-6" dir="rtl">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
  if (!task) return <div>Task not found</div>;


  const aggregated = {
    spend: campaigns.reduce((acc, c) => acc + c.budgetSpent, 0),
    conv: campaigns.reduce((acc, c) => acc + c.conversions, 0),
    rev: campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0),
  };
  const totalRoas = aggregated.spend > 0 ? (aggregated.rev / aggregated.spend).toFixed(2) : "0.00";


  return (
    <div className="flex flex-col gap-6 pb-10" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b pb-6">
        <Link href="/dashboard/marketing/tasks" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors w-fit">
          <ArrowRight className="w-4 h-4" /> العودة للمهام
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary">{task.project?.client?.companyName}</Badge>
              <span className="text-muted-foreground text-sm">/</span>
              <span className="text-muted-foreground text-sm font-medium">{task.project?.name}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 px-3 py-1">
              الحالة: {task.status}
            </Badge>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">أسندت بواسطة</p>
              <p className="text-sm font-semibold">{task.creator?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="campaigns" className="gap-2">
            <Target className="w-4 h-4" />
            الحملات الإعلانية ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <Info className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            ملخص الأداء
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Campaigns */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">إدارة الحملات التنفيذية</h3>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة حملة
            </Button>
          </div>


          {campaigns.length === 0 ? (
            <Card className="border-dashed border-2 py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Layout className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">لا توجد حملات مرتبطة بهذه المهمة بعد.</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>أنشئ أول حملة الآن</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map(campaign => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign} 
                  onView={() => {
                    setSelectedCampaign(campaign);
                    setIsDrawerOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Overview */}
        <TabsContent value="overview">
          <Card className="shadow-sm border-muted/60">
            <CardHeader>
              <CardTitle>وصف المهمة والمتطلبات</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
              <p>{task.description}</p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-muted-foreground mb-1">تاريخ الاستحقاق</h5>
                  <p className="font-semibold text-sm">{new Date(task.dueDate).toLocaleDateString('ar-EG')}</p>

                </div>
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-muted-foreground mb-1">القسم</h5>
                  <p className="font-semibold text-sm text-primary">Marketing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Performance */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PerformanceMetricCard title="إجمالي الإنفاق" value={`$${aggregated.spend}`} icon={<Wallet className="w-4 h-4" />} />
            <PerformanceMetricCard title="إجمالي التحويلات" value={aggregated.conv.toString()} icon={<Target className="w-4 h-4" />} />
            <PerformanceMetricCard title="متوسط الـ ROAS" value={`${totalRoas}x`} icon={<TrendingUp className="w-4 h-4" />} color="text-indigo-600" />
          </div>
        </TabsContent>
      </Tabs>

      <CampaignDetailDrawer 
        campaign={selectedCampaign} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

      <CampaignFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        taskId={taskId}
        clientId={task.project?.clientId}
        projectId={task.projectId}
      />

    </div>
  );
}

function CampaignCard({ campaign, onView }: { campaign: Campaign; onView: () => void }) {
  const metrics = computeMetrics(campaign);
  
  return (
    <Card className={`group relative shadow-sm border-muted/60 hover:border-primary/40 transition-all ${campaign.needsOptimization ? 'border-rose-200 bg-rose-50/10' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold">{campaign.platform}</Badge>
            {campaign.needsOptimization && (
              <Badge variant="destructive" className="text-[9px] animate-pulse">يحتاج تحسين</Badge>
            )}
          </div>
          <Badge className={campaign.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}>
            {campaign.status}
          </Badge>
        </div>

        <h4 className="font-bold text-lg mb-4 group-hover:text-primary transition-colors">{campaign.name}</h4>

        <div className="grid grid-cols-3 gap-y-4 gap-x-2 mb-6 border-y py-4 border-muted/30">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-tight">الإنفاق</p>
            <p className="font-bold text-sm text-slate-800">${campaign.budgetSpent}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-tight">العائد</p>
            <p className="font-bold text-sm text-slate-800">${campaign.revenue}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-tight">الـ ROAS</p>
            <p className={`font-bold text-sm ${parseFloat(metrics.roas) >= 2 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {metrics.roas}x
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-tight">التحويلات</p>
            <p className="font-bold text-sm text-slate-800">{campaign.conversions}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-tight">الـ CPA</p>
            <p className="font-bold text-sm text-slate-800">${metrics.cpa}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-tight">الـ CTR</p>
            <p className="font-bold text-sm text-slate-800">{metrics.ctr}%</p>
          </div>
        </div>


        <Button variant="outline" size="sm" className="w-full gap-2 group-hover:bg-primary group-hover:text-white transition-all" onClick={onView}>
          <Settings2 className="w-4 h-4" />
          إدارة الحملة
        </Button>
      </CardContent>
    </Card>
  );
}

function PerformanceMetricCard({ title, value, icon, color = "text-slate-900" }: { title: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <Card className="shadow-sm border-muted/60">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>
        <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
      </CardContent>
    </Card>
  );
}

function Wallet(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  )
}
