"use client";

import { useMemo } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminSettingsQuery } from "@/features/admin/adminApi";

type GroupedSettings = Record<string, Record<string, unknown>>;

export default function AdminSettingsPage() {
  const { data, isLoading, isError } = useGetAdminSettingsQuery();

  const grouped = useMemo<GroupedSettings>(() => {
    if (!data) return {};
    const groups: GroupedSettings = {};
    for (const [key, value] of Object.entries(data)) {
      const prefix = key.includes(".") ? key.split(".")[0] : "عام";
      if (!groups[prefix]) groups[prefix] = {};
      groups[prefix][key] = value;
    }
    return groups;
  }, [data]);

  const groupKeys = useMemo(() => Object.keys(grouped), [grouped]);

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="الإعدادات"
        description="إعدادات المنصة المختلفة - عرض القيم الحالية"
        icon={SettingsIcon}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 rounded-[30px]" />
        </div>
      ) : isError ? (
        <SurfaceCard>
          <AdminEmptyState
            icon={SettingsIcon}
            title="تعذر تحميل الإعدادات"
            description="حدث خطأ أثناء جلب البيانات. يرجى المحاولة لاحقاً."
          />
        </SurfaceCard>
      ) : groupKeys.length === 0 ? (
        <SurfaceCard>
          <AdminEmptyState
            icon={SettingsIcon}
            title="لا توجد إعدادات"
            description="لم يتم العثور على أي إعدادات في النظام."
          />
        </SurfaceCard>
      ) : (
        groupKeys.map((group) => (
          <SurfaceCard key={group} title={group}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-portal-divider">
                    <th className="py-3 px-4 text-right text-portal-note-text font-medium">
                      المفتاح
                    </th>
                    <th className="py-3 px-4 text-right text-portal-note-text font-medium">
                      القيمة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped[group]).map(([key, value]) => (
                    <tr
                      key={key}
                      className="border-b border-portal-divider last:border-0"
                    >
                      <td className="py-3 px-4 text-natural-100 font-medium dir-ltr text-left">
                        {key}
                      </td>
                      <td className="py-3 px-4 text-portal-note-text">
                        {typeof value === "object" && value !== null
                          ? JSON.stringify(value)
                          : String(value ?? "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        ))
      )}
    </div>
  );
}
