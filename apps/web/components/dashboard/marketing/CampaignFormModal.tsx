"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (campaign: any) => void;
}

export function CampaignFormModal({ isOpen, onClose, onAdd }: CampaignFormModalProps) {
  const [formData, setFormData] = useState({
    campaignName: "",
    platform: "META",
    budget: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: `camp-${Date.now()}`,
      ...formData,
      budget: parseFloat(formData.budget) || 0,
      status: "ACTIVE",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      needsOptimization: false,
    });
    setFormData({
      campaignName: "",
      platform: "META",
      budget: "",
      startDate: new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة حملة إعلانية جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل الحملة الإعلانية التي قمت بإطلاقها يدوياً.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم الحملة</Label>
              <Input
                id="name"
                placeholder="مثال: حملة التوعية - رمضان 2024"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platform">المنصة الإعلانية</Label>
              <Select 
                value={formData.platform} 
                onValueChange={(val) => setFormData({ ...formData, platform: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنصة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="META">Meta (Facebook/Instagram)</SelectItem>
                  <SelectItem value="GOOGLE">Google Ads</SelectItem>
                  <SelectItem value="SNAPCHAT">Snapchat</SelectItem>
                  <SelectItem value="TIKTOK">TikTok</SelectItem>
                  <SelectItem value="TWITTER">X (Twitter)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget">الميزانية المرصودة ($)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="0.00"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">تاريخ البدء</Label>
              <Input
                id="date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="submit">إضافة الحملة</Button>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
