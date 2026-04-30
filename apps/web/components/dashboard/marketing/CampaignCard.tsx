"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle2, 
  MousePointerClick, 
  Eye, 
  TrendingUp, 
  Wallet,
  Activity
} from "lucide-react";
import { Copy } from "lucide-react";

interface CampaignData {
  id: string;
  campaignName: string;
  platform: string;
  status: string;
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  startDate: string;
  needsOptimization: boolean;
}

interface CampaignCardProps {
  campaign: CampaignData;
  onToggleStatus: () => void;
  onToggleOptimization: () => void;
}

export function CampaignCard({ campaign, onToggleStatus, onToggleOptimization }: CampaignCardProps) {
  // Computed Metrics
  const cpc = campaign.clicks > 0 ? (campaign.budget / campaign.clicks).toFixed(2) : "0.00";
  const cpa = campaign.conversions > 0 ? (campaign.budget / campaign.conversions).toFixed(2) : "0.00";
  const conversionRate = campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(1) : "0.0";
  const roas = (campaign.revenue > 0 && campaign.budget > 0) ? (campaign.revenue / campaign.budget).toFixed(2) : "0.00";

  const isPaused = campaign.status === "PAUSED";

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "GOOGLE": return "bg-blue-100 text-blue-700 border-blue-200";
      case "META": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "SNAPCHAT": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "TIKTOK": return "bg-pink-100 text-pink-700 border-pink-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${campaign.needsOptimization ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}>
      {campaign.needsOptimization && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden z-10">
          <div className="absolute top-4 -right-6 bg-orange-500 text-white text-[10px] font-bold py-1 px-8 transform rotate-45 shadow-sm">
            تحتاج تحسين
          </div>
        </div>
      )}
      
      <CardContent className="p-0">
        <div className="p-5 border-b bg-muted/20">
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`${getPlatformColor(campaign.platform)}`}>
                  {campaign.platform}
                </Badge>
                <Badge variant={isPaused ? "secondary" : "default"} className={isPaused ? "" : "bg-emerald-500 hover:bg-emerald-600"}>
                  {isPaused ? "متوقفة" : "نشطة"}
                </Badge>
              </div>
              <h4 className="text-xl font-bold truncate pr-1">{campaign.campaignName}</h4>
              <p className="text-xs text-muted-foreground mt-1">تاريخ البدء: {campaign.startDate}</p>
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-primary">${campaign.budget.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground font-medium">الميزانية الكلية</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3"/> الظهور</p>
              <p className="font-semibold">{campaign.impressions.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MousePointerClick className="w-3 h-3"/> النقرات</p>
              <p className="font-semibold">{campaign.clicks.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> التحويلات</p>
              <p className="font-semibold text-emerald-600">{campaign.conversions}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3"/> العائد</p>
              <p className="font-semibold text-emerald-600">${campaign.revenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-secondary/50 rounded-lg mb-6 border">
            <div className="text-center border-l border-border/50 last:border-0 pl-2">
              <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold tracking-wider">CPC</p>
              <p className="text-sm font-bold">${cpc}</p>
            </div>
            <div className="text-center border-l border-border/50 last:border-0 pl-2">
              <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold tracking-wider">CPA</p>
              <p className="text-sm font-bold">${cpa}</p>
            </div>
            <div className="text-center border-l border-border/50 last:border-0 pl-2">
              <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold tracking-wider">Conv. Rate</p>
              <p className="text-sm font-bold">{conversionRate}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-4">
            <div className="flex gap-2">
              <Button 
                variant={isPaused ? "default" : "outline"} 
                size="sm" 
                className={`gap-2 ${isPaused ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700'}`}
                onClick={onToggleStatus}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? "استئناف" : "إيقاف مؤقت"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className={`gap-2 ${campaign.needsOptimization ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' : 'text-muted-foreground'}`}
                onClick={onToggleOptimization}
              >
                <AlertTriangle className="w-4 h-4" />
                تحديد كـ "تحتاج تحسين"
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary shrink-0" title="تكرار الحملة">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
