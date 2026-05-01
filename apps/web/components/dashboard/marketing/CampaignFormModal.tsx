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
import { 
  CampaignPlatform 
} from "@hassad/shared";
import { useCreateCampaignMutation } from "@/features/marketing/marketingApi";
import { toast } from "sonner";

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  clientId: string;
  projectId?: string;
}

export function CampaignFormModal({ isOpen, onClose, taskId, clientId, projectId }: CampaignFormModalProps) {
  const [createCampaign, { isLoading }] = useCreateCampaignMutation();
  const [formData, setFormData] = useState({
    name: "",
    platform: CampaignPlatform.GOOGLE,
    budgetTotal: 1000,
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCampaign({
        ...formData,
        taskId,
        clientId,
        projectId,
      }).unwrap();
      toast.success("تم إنشاء الحملة بنجاح");
      onClose();
    } catch (err) {
      toast.error("فشل إنشاء الحملة");
    }
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
              onValueChange={(v) => setFormData({ ...formData, platform: v as CampaignPlatform })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المنصة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CampaignPlatform.GOOGLE}>Google Ads</SelectItem>
                <SelectItem value={CampaignPlatform.META}>Meta Ads</SelectItem>
                <SelectItem value={CampaignPlatform.TIKTOK}>TikTok Ads</SelectItem>
                <SelectItem value={CampaignPlatform.SNAPCHAT}>Snapchat Ads</SelectItem>
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
