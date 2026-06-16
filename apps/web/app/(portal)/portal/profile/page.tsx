"use client";

import { useAppSelector } from "@/lib/hooks";
import {
  useGetClientProfileQuery,
  useGetClientByIdQuery,
} from "@/features/clients/clientsApi";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ClientBrief } from "@/components/client-brief";

export default function PortalProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useGetClientProfileQuery(clientId, {
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

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <h1 className="text-xl font-bold text-natural-100">الملف التعريفي</h1>
      <ClientBrief client={client} profile={profile ?? null} />
    </div>
  );
}
