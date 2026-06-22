"use client";

import { useCallback } from "react";
import { useUpsertClientProfileMutation } from "@/features/clients/clientsApi";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { updateUser } from "@/features/auth/authSlice";
import { toast } from "sonner";
import { ProfileForm } from "@/components/shared/IntakeFormFields";
import type { IntakeFormData } from "@/components/shared/IntakeFormFields/types";

interface ProfileSetupFormProps {
  onSuccess: () => void;
}

export function ProfileSetupForm({ onSuccess }: ProfileSetupFormProps) {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [upsertProfile] = useUpsertClientProfileMutation();

  const handleSubmit = useCallback(
    async (data: IntakeFormData) => {
      if (!user?.clientId) {
        toast.error("لم يتم ربط حسابك بعميل. يرجى التواصل مع الإدارة.");
        return;
      }

      try {
        await upsertProfile({
          id: user.clientId,
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

        dispatch(updateUser({ intakeCompleted: true }));
        toast.success("تم حفظ الملف التعريفي بنجاح! جارٍ تحويلك إلى لوحة التحكم...");
        onSuccess();
      } catch (err: unknown) {
        const error = err as { data?: { message?: string | string[] } };
        const msg = error?.data?.message;
        toast.error(
          Array.isArray(msg) ? msg.join("; ") : msg || "حدث خطأ. يرجى المحاولة مرة أخرى."
        );
      }
    },
    [upsertProfile, user?.clientId, dispatch, onSuccess]
  );

  return (
    <ProfileForm
      initialData={undefined}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      mode="portal"
      showInfoBoxes={true}
      showFileUpload={false}
    />
  );
}