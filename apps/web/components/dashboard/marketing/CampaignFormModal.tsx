"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Platform } from "@/lib/marketing-mock";

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (campaign: any) => void;
}

export function CampaignFormModal({ isOpen, onClose, onAdd }: CampaignFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    platform: "GOOGLE" as Platform,
    budgetTotal: 1000,
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      status: "ACTIVE",
      budgetSpent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      needsOptimization: false
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>إنشاء حملة جديدة</DialogTitle>
          <DialogDescription>أضف تفاصيل الحملة الإعلانية المرتبطة بهذه المهمة.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الحملة</Label>
            <Input 
              id="name" 
              placeholder="مثال: بحث جوجل - رمضان" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">المنصة</Label>
            <Select 
              value={formData.platform} 
              onValueChange={(v) => setFormData({ ...formData, platform: v as Platform })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المنصة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOOGLE">Google Ads</SelectItem>
                <SelectItem value="META">Meta Ads</SelectItem>
                <SelectItem value="TIKTOK">TikTok Ads</SelectItem>
                <SelectItem value="SNAPCHAT">Snapchat Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">الميزانية الكلية (USD)</Label>
            <Input 
              id="budget" 
              type="number" 
              value={formData.budgetTotal}
              onChange={(e) => setFormData({ ...formData, budgetTotal: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">تاريخ البدء</Label>
            <Input 
              id="date" 
              type="date" 
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1">تأكيد الإضافة</Button>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
