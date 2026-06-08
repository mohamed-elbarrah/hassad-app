"use client";

import { useState } from "react";
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FormSelect,
  FormSelectTrigger,
  FormSelectValue,
  FormSelectContent,
  FormSelectItem,
} from "@/components/design-system/FormSelectControl";
import { CampaignPlatform } from "@hassad/shared";
import { useCreateCampaignMutation } from "@/features/marketing/marketingApi";
import { toast } from "sonner";

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  clientId: string;
  projectId?: string;
}

export function CampaignFormModal({
  isOpen,
  onClose,
  taskId,
  clientId,
  projectId,
}: CampaignFormModalProps) {
  const [createCampaign, { isLoading }] = useCreateCampaignMutation();
  const [formData, setFormData] = useState({
    name: "",
    platform: CampaignPlatform.GOOGLE,
    budgetTotal: 1000,
    startDate: new Date().toISOString().split("T")[0],
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
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="إنشاء حملة جديدة"
      description="أضف تفاصيل الحملة الإعلانية المرتبطة بهذه المهمة."
      className="sm:max-w-[425px]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="name">اسم الحملة</label>
          <FormInputControl
            id="name"
            placeholder="مثال: بحث جوجل - رمضان"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="platform">المنصة</label>
          <FormSelect
            value={formData.platform}
            onValueChange={(v) =>
              setFormData({ ...formData, platform: v as CampaignPlatform })
            }
          >
            <FormSelectTrigger>
              <FormSelectValue placeholder="اختر المنصة" />
            </FormSelectTrigger>
            <FormSelectContent>
              <FormSelectItem value={CampaignPlatform.GOOGLE}>
                Google Ads
              </FormSelectItem>
              <FormSelectItem value={CampaignPlatform.META}>
                Meta Ads
              </FormSelectItem>
              <FormSelectItem value={CampaignPlatform.TIKTOK}>
                TikTok Ads
              </FormSelectItem>
              <FormSelectItem value={CampaignPlatform.SNAPCHAT}>
                Snapchat Ads
              </FormSelectItem>
            </FormSelectContent>
          </FormSelect>
        </div>

        <div className="space-y-2">
          <label htmlFor="budget">الميزانية الكلية (USD)</label>
          <FormInputControl
            id="budget"
            type="number"
            value={formData.budgetTotal}
            onChange={(e) =>
              setFormData({
                ...formData,
                budgetTotal: parseFloat(e.target.value),
              })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="date">تاريخ البدء</label>
          <FormInputControl
            id="date"
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            required
          />
        </div>
        <div className="pt-4 flex gap-3">
          <ActionButton type="submit" className="flex-1">
            تأكيد الإضافة
          </ActionButton>
          <ActionButton type="button" variant="outline" onClick={onClose}>
            إلغاء
          </ActionButton>
        </div>
      </form>
    </Dialog>
  );
}
