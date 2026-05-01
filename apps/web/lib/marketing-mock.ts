"use client";

import { 
  CampaignPlatform as Platform,
  CampaignStatus,
  TaskStatus,
  Campaign as SharedCampaign
} from "@hassad/shared";

export type { Platform };

export interface Campaign extends Omit<SharedCampaign, 'status' | 'platform'> {
  platform: Platform;
  status: string;
  budgetTotal: number;
  budgetSpent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue?: number | null;
  needsOptimization: boolean;

  startDate: string | Date;
  endDate?: string | Date | null;
}


export interface MarketingTask {
  id: string;
  title: string;
  status: "PLANNING" | "ACTIVE" | "REVIEW" | "DONE";
  assignedTo: string;
  assignedBy: string;
  client: string;
  project: string;
  dueDate: string;
  description: string;
  campaigns: Campaign[];
}

export const MOCK_MARKETING_DATA: MarketingTask[] = [
  {
    id: "t1",
    title: "حملة رمضان الإعلانية",
    status: "ACTIVE",
    assignedTo: "user_marketer_1",
    assignedBy: "أحمد (PM)",
    client: "مطعم ريف العرب",
    project: "التسويق الرقمي Q1",
    dueDate: "2024-04-10",
    description: "إعداد وإدارة الحملات الإعلانية لمنصة سناب شات وجوجل للترويج لعروض رمضان.",
    campaigns: [
      {
        id: "cmp1",
        name: "Snap Ramadan Offer",
        platform: Platform.SNAPCHAT,
        status: "ACTIVE",
        budgetTotal: 10000,
        budgetSpent: 6000,
        impressions: 120000,
        clicks: 3000,
        conversions: 150,
        revenue: 18000,
        needsOptimization: false,
        startDate: "2024-03-01",
      },
      {
        id: "cmp2",
        name: "Google Search Promo",
        platform: Platform.GOOGLE,
        status: "ACTIVE",
        budgetTotal: 8000,
        budgetSpent: 7000,
        impressions: 90000,
        clicks: 1200,
        conversions: 20,
        revenue: 2000,
        needsOptimization: true,
        startDate: "2024-03-05",
      }
    ]
  },
  {
    id: "t2",
    title: "إطلاق الهوية البصرية الجديدة",
    status: "PLANNING",
    assignedTo: "user_marketer_1",
    assignedBy: "سارة (PM)",
    client: "شركة أبعاد",
    project: "تطوير العلامة التجارية",
    dueDate: "2024-05-15",
    description: "إعداد حملات توعوية للهوية البصرية الجديدة عبر منصات التواصل الاجتماعي.",
    campaigns: []
  },
  {
    id: "t3",
    title: "حملة تيك توك الترويجية",
    status: "REVIEW",
    assignedTo: "user_marketer_1",
    assignedBy: "أحمد (PM)",
    client: "متجر السعادة",
    project: "نمو المبيعات Q2",
    dueDate: "2024-04-01",
    description: "مراجعة نتائج حملة تيك توك وإعداد تقرير الأداء النهائي.",
    campaigns: [
      {
        id: "cmp3",
        name: "TikTok Challenge",
        platform: Platform.TIKTOK,
        status: "PAUSED",
        budgetTotal: 5000,
        budgetSpent: 4800,
        impressions: 500000,
        clicks: 15000,
        conversions: 10,
        revenue: 500,
        needsOptimization: true,
        startDate: "2024-02-15",
      }
    ]
  }

];

// Analytics Logic
export const computeMetrics = (c: Campaign) => {
  const cpc = c.clicks > 0 ? c.budgetSpent / c.clicks : 0;
  const cpa = c.conversions > 0 ? c.budgetSpent / c.conversions : 0;
  const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
  const convRate = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
  const roas = c.budgetSpent > 0 ? (c.revenue || 0) / c.budgetSpent : 0;
  const profit = (c.revenue || 0) - c.budgetSpent;
  const cpm = c.impressions > 0 ? (c.budgetSpent / c.impressions) * 1000 : 0;


  return {
    cpc: cpc.toFixed(2),
    cpa: cpa.toFixed(2),
    ctr: ctr.toFixed(2),
    convRate: convRate.toFixed(2),
    roas: roas.toFixed(2),
    profit: profit.toFixed(2),
    cpm: cpm.toFixed(2),
  };
};


export const getAggregatedMetrics = (tasks: MarketingTask[]) => {
  const allCampaigns = tasks.flatMap(t => t.campaigns);
  const totalBudgetUsed = allCampaigns.reduce((acc, c) => acc + c.budgetSpent, 0);
  const totalRevenue = allCampaigns.reduce((acc, c) => acc + c.revenue, 0);
  const totalConversions = allCampaigns.reduce((acc, c) => acc + c.conversions, 0);
  
  const avgRoas = totalBudgetUsed > 0 ? totalRevenue / totalBudgetUsed : 0;
  
  return {
    totalActiveTasks: tasks.filter(t => t.status !== "DONE").length,
    totalActiveCampaigns: allCampaigns.filter(c => c.status === "ACTIVE").length,
    totalBudgetUsed,
    avgRoas: avgRoas.toFixed(2),
    totalConversions
  };
};
