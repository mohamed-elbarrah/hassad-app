"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useUpsertClientProfileV2Mutation } from "@/features/clients/clientsApi";
import type { IntakeFormV2Input } from "@hassad/shared";
import { ActionButton } from "@/components/design-system/ActionButton";

// Shared section components
import {
  CommunicationSection,
  ProductSection,
  AudienceSection,
  JourneySection,
  CampaignSection,
  PerformanceSection,
  VisualSection,
} from "@/components/shared/ProfileSections";

interface ProfileEditTabProps {
  clientId: string;
  profile: any;
}

type FormData = {
  [K in keyof IntakeFormV2Input]?: IntakeFormV2Input[K];
};

export function ProfileEditTab({ clientId, profile }: ProfileEditTabProps) {
  const [upsertProfile, { isLoading: isSaving }] =
    useUpsertClientProfileV2Mutation();

  const [formData, setFormData] = useState<FormData>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setFormData({
        communicationInfo: p.communicationInfo ?? undefined,
        productInfo: p.productInfo ?? undefined,
        audienceInfo: p.audienceInfo ?? undefined,
        brandVoice: p.brandVoice ?? undefined,
        customerJourney: p.customerJourney ?? undefined,
        campaignInfo: p.campaignInfo ?? undefined,
        pastPerformance: p.pastPerformance ?? undefined,
        budgetInfo: p.budgetInfo ?? undefined,
        visualIdentityInfo: p.visualIdentityInfo ?? undefined,
      });
    }
  }, [profile]);

  const updateSection = useCallback(
    <K extends keyof FormData>(key: K, data: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: data }));
      setIsDirty(true);
    },
    [],
  );

  const handleSave = useCallback(async () => {
    try {
      await upsertProfile({
        id: clientId,
        data: formData as any,
      }).unwrap();
      toast.success("تم حفظ التغييرات بنجاح");
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الحفظ");
    }
  }, [clientId, formData, upsertProfile]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-natural-100">
            تعديل الملف التعريفي
          </h2>
          <p className="text-sm text-gray-500 mt-1">قم بتحديث معلومات العميل</p>
        </div>
        {isDirty && (
          <span className="text-xs text-red-500">لديك تغييرات غير محفوظة</span>
        )}
      </div>

      {/* Section 1: Communication */}
      <CommunicationSection
        mode="edit"
        initialData={formData.communicationInfo}
        onDataChange={(data) => updateSection("communicationInfo", data)}
        hideNavigation
      />

      {/* Section 2: Product Info */}
      <ProductSection
        mode="edit"
        initialData={formData.productInfo}
        onDataChange={(data) => updateSection("productInfo", data)}
        hideNavigation
      />

      {/* Section 3: Audience & Brand Voice */}
      <AudienceSection
        mode="edit"
        initialData={{
          customerAnalysis: formData.audienceInfo?.customerAnalysis,
          faq: formData.audienceInfo?.faq as
            | { question?: string; answer?: string }[]
            | undefined,
          toneOfVoice: formData.brandVoice?.toneOfVoice,
          boundaries: formData.brandVoice?.boundaries,
          verbalSlogan: formData.brandVoice?.verbalSlogan,
          appearanceMethod: formData.brandVoice?.appearanceMethod,
        }}
        onDataChange={(data) => {
          updateSection("audienceInfo", {
            customerAnalysis: data.audienceInfo?.customerAnalysis,
            faq: data.audienceInfo?.faq as any,
          });
          updateSection("brandVoice", data.brandVoice);
        }}
        hideNavigation
      />

      {/* Section 4: Customer Journey */}
      <JourneySection
        mode="edit"
        initialData={formData.customerJourney}
        onDataChange={(data) => updateSection("customerJourney", data)}
        hideNavigation
      />

      {/* Section 5: Campaign */}
      <CampaignSection
        mode="edit"
        initialData={formData.campaignInfo}
        onDataChange={(data) => updateSection("campaignInfo", data)}
        hideNavigation
      />

      {/* Section 6: Performance & Budget */}
      <PerformanceSection
        mode="edit"
        initialData={{
          pastPerformance: formData.pastPerformance,
          budgetInfo: formData.budgetInfo,
        }}
        onDataChange={(data) => {
          updateSection("pastPerformance", data.pastPerformance);
          updateSection("budgetInfo", data.budgetInfo);
        }}
        hideNavigation
      />

      {/* Section 7: Visual Identity */}
      <VisualSection
        mode="edit"
        initialData={formData.visualIdentityInfo as any}
        onDataChange={(data) =>
          updateSection("visualIdentityInfo", data as any)
        }
        hideNavigation
      />

      {/* Global Save Button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-end gap-3">
        <ActionButton
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={!isDirty}
          loading={isSaving}
          icon={isSaving ? undefined : <Save className="w-4 h-4" />}
        >
          {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </ActionButton>
      </div>
    </div>
  );
}
