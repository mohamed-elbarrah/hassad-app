"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  useGetClientProfileV2Query,
  useUpsertClientProfileV2Mutation,
} from "@/features/clients/clientsApi";
import { useUpdateUserMutation } from "@/features/users/usersApi";
import type { IntakeFormV2Input } from "@hassad/shared";

// Shared section components
import {
  PersonalInfoSection,
  CommunicationSection,
  ProductSection,
  AudienceSection,
  JourneySection,
  CampaignSection,
  PerformanceSection,
  VisualSection,
} from "@/components/shared/ProfileSections";

interface ProfileEditV2Props {
  clientId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

type FormData = {
  [K in keyof IntakeFormV2Input]?: IntakeFormV2Input[K];
};

export function ProfileEditV2({
  clientId,
  onCancel,
  onSuccess,
}: ProfileEditV2Props) {
  // Use the V2 profile endpoint (canonical source for V2 fields)
  const { data: profile, isLoading } = useGetClientProfileV2Query(clientId);
  const [upsertProfile, { isLoading: isSaving }] =
    useUpsertClientProfileV2Mutation();
  const [updateUser] = useUpdateUserMutation();

  const [formData, setFormData] = useState<FormData>({});
  const [personalInfo, setPersonalInfo] = useState<Record<string, any> | null>(null);
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
      if (personalInfo) {
        await updateUser({
          id: clientId,
          body: {
            name: personalInfo.name,
            email: personalInfo.email || undefined,
            phoneWhatsapp: personalInfo.phoneWhatsapp || undefined,
          },
        }).unwrap();
      }
      await upsertProfile({
        id: clientId,
        data: formData as any,
      }).unwrap();
      toast.success("تم حفظ التغييرات بنجاح");
      setIsDirty(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الحفظ");
    }
  }, [clientId, personalInfo, formData, upsertProfile, updateUser, onSuccess]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-natural-100">
            تعديل الملف التعريفي
          </h2>
          <p className="text-sm text-portal-note-text mt-1">
            قم بتحديث معلومات نشاطك التجاري
          </p>
        </div>
        {isDirty && (
          <span className="text-xs text-alert-500">
            لديك تغييرات غير محفوظة
          </span>
        )}
      </div>

      {/* Section 1: Personal Info — writes to User (single source of truth) */}
      <PersonalInfoSection
        mode="edit"
        hideNavigation
        onDataChange={(data) => {
          setPersonalInfo(data);
          setIsDirty(true);
        }}
      />

      {/* Section 2: Business Communication */}
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
      <div className="sticky bottom-0 bg-natural-0 border-t border-portal-divider p-4 flex items-center justify-end gap-3">
        {onCancel && (
          <ActionButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            إلغاء
          </ActionButton>
        )}
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
