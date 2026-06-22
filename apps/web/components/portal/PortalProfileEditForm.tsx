"use client";

import { useCallback } from "react";
import { ProfileForm } from "@/components/shared/IntakeFormFields";
import type { IntakeFormData } from "@/components/shared/IntakeFormFields/types";
import { useUpsertClientProfileMutation } from "@/features/clients/clientsApi";

interface PortalProfileEditFormProps {
  clientId: string;
  profile: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export function PortalProfileEditForm({
  clientId,
  profile,
  onCancel,
  onSuccess,
}: PortalProfileEditFormProps) {
  const [upsertProfile] = useUpsertClientProfileMutation();

  const handleSubmit = useCallback(
    async (data: IntakeFormData) => {
      await upsertProfile({
        id: clientId,
        data: {
          // Section 1: Business Basics
          industry: data.industry,
          businessDescription: data.businessDescription,
          targetAudience: data.targetAudience,
          budgetRangeMin: data.budgetRangeMin,
          budgetRangeMax: data.budgetRangeMax,

          // Section 2: Marketing Goals
          campaignGoals: data.campaignGoals,
          campaignOffer: data.campaignOffer,
          competitors: data.competitors,
          seasonalTiming: data.seasonalTiming,

          // Section 3: Customer Journey
          orderMethods: data.orderMethods,
          abandonedCartSystem: data.abandonedCartSystem,

          // Section 4: Creative & Brand Assets
          hasVisualIdentity: data.hasVisualIdentity,
          brandAssets: data.brandAssets,
          visualReferences: data.visualReferences,
          uploadedFiles: data.uploadedFiles,
        },
      }).unwrap();
    },
    [clientId, upsertProfile]
  );

  // Map profile data to IntakeFormData format
  const initialData: IntakeFormData | undefined = profile
    ? {
        industry: profile.industry ?? undefined,
        businessDescription: profile.businessDescription ?? undefined,
        targetAudience: profile.targetAudience ?? undefined,
        budgetRangeMin: profile.budgetRangeMin ?? undefined,
        budgetRangeMax: profile.budgetRangeMax ?? undefined,
        campaignGoals: profile.campaignGoals ?? undefined,
        campaignOffer: profile.campaignOffer ?? undefined,
        competitors: profile.competitors ?? undefined,
        seasonalTiming: profile.seasonalTiming ?? undefined,
        orderMethods: profile.orderMethods ?? undefined,
        abandonedCartSystem: profile.abandonedCartSystem ?? undefined,
        hasVisualIdentity: profile.hasVisualIdentity ?? undefined,
        brandAssets: profile.brandAssets ?? undefined,
        visualReferences: profile.visualReferences ?? undefined,
        uploadedFiles: profile.uploadedFiles ?? undefined,
      }
    : undefined;

  return (
    <div className="rounded-2xl border border-portal-card-border bg-natural-0 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-natural-100">تعديل الملف التعريفي</h2>
      </div>

      <ProfileForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        onSuccess={onSuccess}
        mode="portal"
        showInfoBoxes={false}
        showFileUpload={false}
      />
    </div>
  );
}