"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  Target, 
  MousePointerClick, 
  Zap, 
  AlertCircle,
  Pause,
  Play,
  Square,
  Copy,
  BarChart3,
  DollarSign,
  Activity,
  ArrowRightLeft
} from "lucide-react";
import { Campaign, computeMetrics } from "@/lib/marketing-mock";
import { 
  useUpdateCampaignMetricsMutation, 
  useUpdateCampaignStatusMutation,
  useFlagOptimizationMutation,
  useDuplicateCampaignMutation 
} from "@/features/marketing/marketingApi";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CampaignDetailDrawerProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updated: any) => void;
}

export function CampaignDetailDrawer({ campaign, isOpen, onClose, onUpdate }: CampaignDetailDrawerProps) {
  const [updateMetrics, { isLoading: isUpdatingMetrics }] = useUpdateCampaignMetricsMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateCampaignStatusMutation();
  const [flagOptimization, { isLoading: isFlagging }] = useFlagOptimizationMutation();
  const [duplicate, { isLoading: isDuplicating }] = useDuplicateCampaignMutation();

  if (!campaign) return null;

  const metrics = computeMetrics(campaign);
  const isProfitable = parseFloat(metrics.profit) > 0;

  const handleStatusAction = async (action: 'start' | 'pause' | 'stop' | 'end') => {
    try {
      await updateStatus({ id: campaign.id, action }).unwrap();
      toast.success("تم تحديث حالة الحملة");
    } catch (err) {
      toast.error("فشل تحديث الحالة");
    }
  };

  const handleFlagOptimization = async () => {
    try {
      await flagOptimization({ id: campaign.id, needsOptimization: !campaign.needsOptimization }).unwrap();
      toast.success("تم تحديث حالة التحسين");
    } catch (err) {
      toast.error("فشل التحديث");
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicate(campaign.id).unwrap();
      toast.success("تم تكرار الحملة بنجاح");
      onClose();
    } catch (err) {
      toast.error("فشل تكرار الحملة");
    }
  };

  const handleMetricChange = async (field: string, value: number) => {
    try {
      await updateMetrics({ id: campaign.id, body: { [field]: value } }).unwrap();
    } catch (err) {
      toast.error("فشل تحديث المقاييس");
    }
  };


  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto" dir="rtl">
        <SheetHeader className="text-right">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="uppercase font-bold tracking-tighter">
              {campaign.platform}
            </Badge>
            <Badge className={campaign.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}>
              {campaign.status}
            </Badge>
          </div>
          <SheetTitle className="text-2xl font-bold">{campaign.name}</SheetTitle>
          <SheetDescription>تحليل عميق للأداء واتخاذ قرارات تحسين الحملة</SheetDescription>
        </SheetHeader>

        <div className="space-y-8 mt-8">
          {/* Quick Decision Panel */}
          <div className="bg-muted/30 p-4 rounded-xl border border-muted-foreground/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-primary" />
                الإجراءات السريعة
              </h4>
              {isProfitable ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">مربحة ✅</Badge>
              ) : (
                <Badge className="bg-rose-100 text-rose-700 border-rose-200">غير مربحة ⚠️</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant={campaign.status === 'ACTIVE' ? 'outline' : 'default'} 
                className="gap-2 shadow-sm"
                onClick={() => handleStatusAction(campaign.status === 'ACTIVE' ? 'pause' : 'start')}
                disabled={isUpdatingStatus}
              >
                {campaign.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {campaign.status === 'ACTIVE' ? 'إيقاف مؤقت' : 'تفعيل'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 shadow-sm"
                onClick={() => handleStatusAction('stop')}
                disabled={isUpdatingStatus}
              >
                <Square className="w-4 h-4" />
                إنهاء نهائي
              </Button>
              <Button size="sm" variant="outline" className="gap-2 shadow-sm" onClick={handleDuplicate} disabled={isDuplicating}>
                <Copy className="w-4 h-4" />
                تكرار
              </Button>
              <Button 
                size="sm" 
                variant={campaign.needsOptimization ? 'destructive' : 'outline'} 
                className="gap-2 shadow-sm"
                onClick={handleFlagOptimization}
                disabled={isFlagging}
              >
                <AlertCircle className="w-4 h-4" />
                {campaign.needsOptimization ? 'تم التحسين' : 'يحتاج تحسين'}
              </Button>
            </div>

          </div>

          {/* Deep Analytics Sections */}
          <div className="space-y-6">
            {/* Section 1: Financials & Profitability */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                <DollarSign className="w-3.5 h-3.5" /> الأداء المالي والربحية
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AnalyticsMetric label="الربح الصافي" value={`$${metrics.profit}`} isGood={isProfitable} />
                <AnalyticsMetric label="الـ ROAS" value={`${metrics.roas}x`} isGood={parseFloat(metrics.roas) >= 2} />
                <AnalyticsMetric label="الإنفاق الكلي" value={`$${campaign.budgetSpent}`} />
                <AnalyticsMetric label="إجمالي العائد" value={`$${campaign.revenue}`} />
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Section 2: Conversions & Acquisition */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                <Target className="w-3.5 h-3.5" /> التحويلات والاستحواذ
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AnalyticsMetric label="التحويلات" value={campaign.conversions.toString()} />
                <AnalyticsMetric label="الـ CPA" value={`$${metrics.cpa}`} isGood={parseFloat(metrics.cpa) < 50} />
                <AnalyticsMetric label="معدل التحويل" value={`${metrics.convRate}%`} isGood={parseFloat(metrics.convRate) > 1} />
                <AnalyticsMetric label="تكلفة العميل" value={`$${metrics.cpa}`} />
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Section 3: Engagement & Delivery */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                <Activity className="w-3.5 h-3.5" /> التفاعل والوصول
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AnalyticsMetric label="الظهور" value={campaign.impressions.toLocaleString()} />
                <AnalyticsMetric label="النقرات" value={campaign.clicks.toLocaleString()} />
                <AnalyticsMetric label="الـ CTR" value={`${metrics.ctr}%`} isGood={parseFloat(metrics.ctr) > 0.8} />
                <AnalyticsMetric label="الـ CPM" value={`$${metrics.cpm}`} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Editable Metrics (Data Entry) */}
          <div className="bg-muted/10 p-6 rounded-2xl border border-dashed border-muted-foreground/20 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> 
                إدخال البيانات الحية (تزامن يدوي)
              </h4>
              <span className="text-[10px] text-muted-foreground">آخر تحديث: الآن</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">الإنفاق الفعلي (USD)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={campaign.budgetSpent} 
                    onChange={(e) => handleMetricChange('budgetSpent', parseFloat(e.target.value))}
                    disabled={isUpdatingMetrics}
                    className="pl-8"
                  />
                  <DollarSign className="w-3 h-3 absolute left-3 top-3 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">العائد المحقق (Revenue)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={campaign.revenue || 0} 
                    onChange={(e) => handleMetricChange('revenue', parseFloat(e.target.value))}
                    disabled={isUpdatingMetrics}
                    className="pl-8"
                  />
                  <TrendingUp className="w-3 h-3 absolute left-3 top-3 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">إجمالي التحويلات</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={campaign.conversions} 
                    onChange={(e) => handleMetricChange('conversions', parseInt(e.target.value))}
                    disabled={isUpdatingMetrics}
                    className="pl-8"
                  />
                  <Target className="w-3 h-3 absolute left-3 top-3 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">إجمالي النقرات</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={campaign.clicks} 
                    onChange={(e) => handleMetricChange('clicks', parseInt(e.target.value))}
                    disabled={isUpdatingMetrics}
                    className="pl-8"
                  />
                  <MousePointerClick className="w-3 h-3 absolute left-3 top-3 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">إجمالي مرات الظهور</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={campaign.impressions} 
                    onChange={(e) => handleMetricChange('impressions', parseInt(e.target.value))}
                    disabled={isUpdatingMetrics}
                    className="pl-8"
                  />
                  <ArrowRightLeft className="w-3 h-3 absolute left-3 top-3 text-muted-foreground opacity-50" />
                </div>
              </div>
            </div>

            
            <Button className="w-full shadow-lg" onClick={onClose}>حفظ ومزامنة البيانات</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AnalyticsMetric({ label, value, isGood }: { label: string; value: string; isGood?: boolean }) {
  return (
    <div className="bg-background p-3 rounded-xl border shadow-sm transition-all hover:border-primary/20">
      <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-tight">{label}</p>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold tracking-tight ${isGood === true ? 'text-emerald-600' : isGood === false ? 'text-rose-600' : 'text-slate-800'}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
