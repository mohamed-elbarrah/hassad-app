"use client";

import { useParams, notFound } from "next/navigation";
import { DollarSign } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { Skeleton } from "@/components/design-system/Skeleton";
import CurrencyForm from "@/components/dashboard/admin/settings/CurrencyForm";
import { useGetCurrencySettingQuery } from "@/features/settings/settingsApi";

export default function AdminEditCurrencyPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, isLoading, isError } = useGetCurrencySettingQuery(id, {
    skip: !id,
  });

  if (!id) return notFound();

  if (isLoading) {
    return (
      <div className="page-shell" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-[30px]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="page-shell" dir="rtl">
        <PageIntro
          title="تعديل العملة"
          description="تعذر تحميل بيانات العملة"
          icon={DollarSign}
        />
        <SurfaceCard>
          <AdminEmptyState
            icon={DollarSign}
            title="تعذر تحميل العملة"
            description="لم يتم العثور على العملة أو حدث خطأ أثناء جلب البيانات."
          />
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title={`تعديل العملة: ${data.name}`}
        description={`${data.code} - ${data.name}`}
        icon={DollarSign}
      />
      <CurrencyForm initialData={data} mode="edit" />
    </div>
  );
}
