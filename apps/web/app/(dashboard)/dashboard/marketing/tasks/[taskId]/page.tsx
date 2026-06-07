"use client";

import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/design-system/Tabs";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
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
import { Skeleton } from "@/components/design-system/Skeleton";

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
    spend: campaigns.reduce((acc, c) => acc + (c.budgetSpent ?? 0), 0),
    conv: campaigns.reduce((acc, c) => acc + (c.conversions ?? 0), 0),
    rev: campaigns.reduce((acc, c) => acc + (c.revenue ?? 0), 0),
  };
  const totalRoas = aggregated.spend > 0 ? (aggregated.rev / aggregated.spend).toFixed(2) : "0.00";


  return (
    <div className="flex flex-col gap-6 pb-10" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b pb-6">
        <Link href="/dashboard/marketing/tasks" className="text-sm text-neutral-300 flex items-center gap-1 hover:text-secondary-500 transition-colors w-fit">
          <ArrowRight className="w-4 h-4" /> العودة للمهام
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Pill tone="neutral">{task.project?.client?.companyName}</Pill>
              <span className="text-neutral-300 text-sm">/</span>
              <span className="text-neutral-300 text-sm font-medium">{task.project?.name}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone="success" className="px-3 py-1">
              الحالة: {task.status}
            </Pill>
            <div className="text-right">
              <p className="text-[10px] text-neutral-300 font-bold uppercase tracking-wider">أسندت بواسطة</p>
              <p className="text-sm font-semibold">{task.creator?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="bg-neutral-50/50 p-1">
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
            <ActionButton onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة حملة
            </ActionButton>
          </div>


          {campaigns.length === 0 ? (
            <SurfaceCard className="border-dashed border-2" contentClassName="flex flex-col items-center justify-center text-center py-12">
              <Layout className="w-12 h-12 text-neutral-300/40 mb-4" />
              <p className="text-neutral-300 font-medium">لا توجد حملات مرتبطة بهذه المهمة بعد.</p>
              <ActionButton variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>أنشئ أول حملة الآن</ActionButton>
            </SurfaceCard>
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
          <SurfaceCard className="shadow-sm border-neutral-50/60" title="وصف المهمة والمتطلبات" contentClassName="prose prose-sm max-w-none text-neutral-300 leading-relaxed">
            <p>{task.description}</p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <h5 className="text-[10px] uppercase font-bold text-neutral-300 mb-1">تاريخ الاستحقاق</h5>
                <p className="font-semibold text-sm">{new Date(task.dueDate).toLocaleDateString('ar-EG')}</p>

              </div>
              <div>
                <h5 className="text-[10px] uppercase font-bold text-neutral-300 mb-1">القسم</h5>
                <p className="font-semibold text-sm text-secondary-500">Marketing</p>
              </div>
            </div>
          </SurfaceCard>
        </TabsContent>

        {/* Tab 3: Performance */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PerformanceMetricCard title="إجمالي الإنفاق" value={`$${aggregated.spend}`} icon={<Wallet className="w-4 h-4" />} />
            <PerformanceMetricCard title="إجمالي التحويلات" value={aggregated.conv.toString()} icon={<Target className="w-4 h-4" />} />
            <PerformanceMetricCard title="متوسط الـ ROAS" value={`${totalRoas}x`} icon={<TrendingUp className="w-4 h-4" />} color="text-secondary-600" />
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
    <SurfaceCard className={`group relative shadow-sm border-neutral-50/60 hover:border-secondary-500/40 transition-all ${campaign.needsOptimization ? 'border-danger-200 bg-danger-50/10' : ''}`} contentClassName="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pill tone="neutral" className="text-[10px] font-bold">{campaign.platform}</Pill>
          {campaign.needsOptimization && (
            <Pill tone="danger" className="text-[9px] animate-pulse">يحتاج تحسين</Pill>
          )}
        </div>
        <Pill tone={campaign.status === 'ACTIVE' ? 'success' : 'neutral'} className={`${campaign.status === 'ACTIVE' ? 'bg-success-500 text-white' : 'bg-neutral-300 text-white'}`}>
          {campaign.status}
        </Pill>
      </div>

      <h4 className="font-bold text-lg mb-4 group-hover:text-secondary-500 transition-colors">{campaign.name}</h4>

      <div className="grid grid-cols-3 gap-y-4 gap-x-2 mb-6 border-y py-4 border-neutral-50/30">
        <div>
          <p className="text-[10px] text-neutral-300 font-medium mb-1 uppercase tracking-tight">الإنفاق</p>
          <p className="font-bold text-sm text-natural-100">${campaign.budgetSpent}</p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-300 font-medium mb-1 uppercase tracking-tight">العائد</p>
          <p className="font-bold text-sm text-natural-100">${campaign.revenue}</p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-300 font-medium mb-1 uppercase tracking-tight">الـ ROAS</p>
          <p className={`font-bold text-sm ${parseFloat(metrics.roas) >= 2 ? 'text-success-600' : 'text-danger-600'}`}>
            {metrics.roas}x
          </p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-300 font-medium mb-1 uppercase tracking-tight">التحويلات</p>
          <p className="font-bold text-sm text-natural-100">{campaign.conversions}</p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-300 font-medium mb-1 uppercase tracking-tight">الـ CPA</p>
          <p className="font-bold text-sm text-natural-100">${metrics.cpa}</p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-300 font-medium mb-1 uppercase tracking-tight">الـ CTR</p>
          <p className="font-bold text-sm text-natural-100">{metrics.ctr}%</p>
        </div>
      </div>


      <ActionButton variant="outline" size="sm" className="w-full gap-2 group-hover:bg-secondary-500 group-hover:text-white transition-all" onClick={onView}>
        <Settings2 className="w-4 h-4" />
        إدارة الحملة
      </ActionButton>
    </SurfaceCard>
  );
}

function PerformanceMetricCard({ title, value, icon, color = "text-natural-100" }: { title: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <SurfaceCard className="shadow-sm border-neutral-50/60" contentClassName="p-6">
      <div className="flex items-center gap-3 mb-2 text-neutral-300">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
    </SurfaceCard>
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

function AnalyticsMetric({ label, value, isGood }: { label: string; value: string; isGood?: boolean }) {
  return (
    <div className="bg-natural-0 p-3 rounded-xl border shadow-sm transition-all hover:border-secondary-500/20">
      <p className="text-[10px] text-neutral-300 font-medium mb-1 uppercase tracking-tight">{label}</p>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold tracking-tight ${isGood === true ? 'text-success-600' : isGood === false ? 'text-danger-600' : 'text-natural-100'}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
