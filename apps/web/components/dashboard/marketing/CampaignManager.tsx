"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "./CampaignCard";
import { CampaignFormModal } from "./CampaignFormModal";

// Mock Campaigns tied to task-1
const MOCK_CAMPAIGNS_1 = [
  {
    id: "camp-1",
    campaignName: "إعلانات جوجل - البحث",
    platform: "GOOGLE",
    status: "ACTIVE",
    budget: 5000,
    impressions: 45000,
    clicks: 1200,
    conversions: 45,
    revenue: 12500,
    startDate: "2024-03-01",
    needsOptimization: false,
  },
  {
    id: "camp-2",
    campaignName: "حملة سناب شات - رمضان",
    platform: "SNAPCHAT",
    status: "ACTIVE",
    budget: 3000,
    impressions: 120000,
    clicks: 3400,
    conversions: 20,
    revenue: 4000,
    startDate: "2024-03-05",
    needsOptimization: true,
  },
];

const MOCK_CAMPAIGNS_2 = [
  {
    id: "camp-3",
    campaignName: "تيك توك - تحدي التصميم",
    platform: "TIKTOK",
    status: "PAUSED",
    budget: 2000,
    impressions: 250000,
    clicks: 5000,
    conversions: 15,
    revenue: 0,
    startDate: "2024-03-20",
    needsOptimization: true,
  }
];

interface CampaignManagerProps {
  taskId: string;
  taskTitle: string;
}

export function CampaignManager({ taskId, taskTitle }: CampaignManagerProps) {
  // Use simple local state for mockup
  const initialCampaigns = taskId === "task-1" ? MOCK_CAMPAIGNS_1 : MOCK_CAMPAIGNS_2;
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleStatus = (campId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campId) {
        const newStatus = c.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
        return { ...c, status: newStatus };
      }
      return c;
    }));
  };

  const toggleOptimization = (campId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campId) {
        return { ...c, needsOptimization: !c.needsOptimization };
      }
      return c;
    }));
  };

  const handleAddCampaign = (newCamp: any) => {
    setCampaigns([newCamp, ...campaigns]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-background p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">الحملات التابعة لهذه المهمة</h3>
            <p className="text-sm text-muted-foreground">قم بإدارة أداء وميزانية الحملات الخاصة بـ "{taskTitle}"</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
          <Plus className="w-4 h-4" />
          إضافة حملة يدوياً
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed rounded-xl bg-background/50">
          <p className="text-muted-foreground mb-4">لا توجد حملات مسجلة لهذه المهمة بعد.</p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>ابدأ بإضافة أول حملة</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map(camp => (
            <CampaignCard 
              key={camp.id} 
              campaign={camp} 
              onToggleStatus={() => toggleStatus(camp.id)}
              onToggleOptimization={() => toggleOptimization(camp.id)}
            />
          ))}
        </div>
      )}

      <CampaignFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddCampaign} 
      />
    </div>
  );
}
