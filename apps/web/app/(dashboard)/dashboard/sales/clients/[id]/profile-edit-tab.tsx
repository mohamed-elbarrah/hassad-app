"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import {
  useUpsertSalesClientProfileV2Mutation,
  type UpsertClientProfileV2Input,
} from "@/features/clients/clientsApi";
import type { ClientProfile, IntakeFormV2Input } from "@hassad/shared";
import { salesWorkflowErrorMessage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  profile: ClientProfile | null;
}

type FormData = {
  [K in keyof IntakeFormV2Input]?: IntakeFormV2Input[K];
};

export function ProfileEditTab({ clientId, profile }: ProfileEditTabProps) {
  const [upsertProfile, { isLoading: isSaving }] =
    useUpsertSalesClientProfileV2Mutation();

  const [formData, setFormData] = useState<FormData>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        communicationInfo: profile.communicationInfo ?? undefined,
        productInfo: profile.productInfo ?? undefined,
        audienceInfo: profile.audienceInfo ?? undefined,
        brandVoice: profile.brandVoice ?? undefined,
        customerJourney: profile.customerJourney ?? undefined,
        campaignInfo: profile.campaignInfo ?? undefined,
        pastPerformance: profile.pastPerformance ?? undefined,
        budgetInfo: profile.budgetInfo ?? undefined,
        visualIdentityInfo: profile.visualIdentityInfo ?? undefined,
      } as FormData);
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
        data: formData as UpsertClientProfileV2Input,
      }).unwrap();
      toast.success("تم حفظ التغييرات بنجاح");
      setIsDirty(false);
    } catch (error: unknown) {
      toast.error(salesWorkflowErrorMessage(error));
    }
  }, [clientId, formData, upsertProfile]);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            تعديل الملف التعريفي
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            قم بتحديث معلومات العميل
          </p>
        </div>
        {isDirty ? (
          <span className="text-xs text-destructive">
            لديك تغييرات غير محفوظة
          </span>
        ) : null}
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
      <Separator />
      <div className="sticky bottom-0 flex items-center justify-end gap-3 bg-background p-4">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? (
            "جاري الحفظ..."
          ) : (
            <>
              <Save data-icon="inline-start" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
