"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetClientProfileV2Query,
  useGetClientByIdQuery,
} from "@/features/clients/clientsApi";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ClientBriefV2 } from "@/components/client-brief/ClientBriefV2";
import { ProfileEditV2 } from "@/components/portal/ProfileEditV2";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pencil, ArrowRight } from "lucide-react";

export default function PortalProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";
  const [isEditing, setIsEditing] = useState(false);

  // Use V2 endpoint for fetching profile data
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useGetClientProfileV2Query(clientId, {
    skip: !clientId,
  });

  const {
    data: client,
    isLoading: clientLoading,
    isError: clientError,
  } = useGetClientByIdQuery(clientId, {
    skip: !clientId,
  });

  if (!clientId) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4"
        dir="rtl"
      >
        <p className="text-lg text-portal-note-text">
          لم يتم ربط حسابك بملف عميل. يرجى التواصل مع الإدارة.
        </p>
      </div>
    );
  }

  const isLoading = profileLoading || clientLoading;
  const isError = profileError || clientError;

  if (isLoading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-8 w-48 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3">
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <div className="lg:col-span-6 space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4"
        dir="rtl"
      >
        <p className="text-base text-portal-note-text">
          لا توجد معلومات إضافية. يمكنك تحديث ملفك من خلال فريق المبيعات.
        </p>
      </div>
    );
  }

  const handleEditSuccess = () => {
    setIsEditing(false);
    refetchProfile();
  };

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-natural-100">
          {isEditing ? "تعديل الملف التعريفي" : "الملف التعريفي"}
        </h1>
        {isEditing ? (
          <ActionButton
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            العودة للعرض
          </ActionButton>
        ) : (
          <ActionButton
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            icon={<Pencil className="h-4 w-4" />}
          >
            تعديل الملف
          </ActionButton>
        )}
      </div>

      {isEditing ? (
        <ProfileEditV2
          clientId={clientId}
          onCancel={() => setIsEditing(false)}
          onSuccess={handleEditSuccess}
        />
      ) : (
        <ClientBriefV2
          client={client}
          profile={profile ?? null}
          viewAs="portal"
        />
      )}
    </div>
  );
}