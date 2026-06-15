"use client";

import { useAppSelector } from "@/lib/hooks";
import { useGetClientProfileQuery } from "@/features/clients/clientsApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { User, Building2, Globe, Clock, MessageCircle, DollarSign, Target, Palette, Languages } from "lucide-react";

function FieldRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-portal-card-border">
      <div className="w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-secondary-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-400">{label}</p>
        <p className="text-sm font-medium text-natural-100">{value}</p>
      </div>
    </div>
  );
}

export default function PortalProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const { data: profile, isLoading, isError } = useGetClientProfileQuery(clientId, {
    skip: !clientId,
  });

  if (!clientId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" dir="rtl">
        <p className="text-lg text-portal-note-text">
          لم يتم ربط حسابك بملف عميل. يرجى التواصل مع الإدارة.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-8 w-48 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" dir="rtl">
        <p className="text-base text-portal-note-text">
          لا توجد معلومات إضافية. يمكنك تحديث ملفك من خلال فريق المبيعات.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <h1 className="text-xl font-bold text-natural-100">الملف التعريفي</h1>

      <SurfaceCard title="معلومات النشاط التجاري" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldRow icon={Building2} label="القطاع" value={profile.industry} />
          <FieldRow icon={Target} label="الجمهور المستهدف" value={profile.targetAudience} />
          <FieldRow icon={DollarSign} label="الميزانية" value={
            profile.budgetRangeMin != null && profile.budgetRangeMax != null
              ? `${profile.budgetRangeMin.toLocaleString("ar-SA-u-nu-latn")} - ${profile.budgetRangeMax.toLocaleString("ar-SA-u-nu-latn")} ريال`
              : null
          } />
          <FieldRow icon={Globe} label="المنصات المفضلة" value={profile.preferredPlatforms} />
        </div>
        {profile.businessDescription && (
          <div className="mt-4 p-4 rounded-xl bg-portal-bg border border-portal-card-border">
            <p className="text-xs text-neutral-400 mb-1">وصف النشاط التجاري</p>
            <p className="text-sm text-natural-100 leading-relaxed">{profile.businessDescription}</p>
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard title="تفضيلات التواصل" icon={MessageCircle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldRow icon={MessageCircle} label="طريقة التواصل المفضلة" value={profile.communicationPreference} />
          <FieldRow icon={Languages} label="اللغة المفضلة" value={profile.preferredLanguage} />
          <FieldRow icon={Clock} label="المنطقة الزمنية" value={profile.timezone} />
        </div>
      </SurfaceCard>

      {profile.competitors && profile.competitors.length > 0 && (
        <SurfaceCard title="المنافسون" icon={Target}>
          <div className="space-y-3">
            {profile.competitors.map((comp, i) => (
              <div key={i} className="p-3 rounded-xl bg-white border border-portal-card-border">
                <p className="text-sm font-medium text-natural-100">{comp.name}</p>
                {comp.url && (
                  <p className="text-xs text-secondary-500 mt-0.5" dir="ltr">{comp.url}</p>
                )}
                {comp.notes && (
                  <p className="text-xs text-neutral-400 mt-1">{comp.notes}</p>
                )}
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {profile.brandAssets && (
        <SurfaceCard title="هوية العلامة التجارية" icon={Palette}>
          <div className="space-y-3">
            {profile.brandAssets.logoUrl && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-portal-card-border">
                <Palette className="w-5 h-5 text-secondary-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-400">الشعار</p>
                  <p className="text-xs text-secondary-500 truncate" dir="ltr">{profile.brandAssets.logoUrl}</p>
                </div>
              </div>
            )}
            {profile.brandAssets.brandColors && profile.brandAssets.brandColors.length > 0 && (
              <div className="p-3 rounded-xl bg-white border border-portal-card-border">
                <p className="text-xs text-neutral-400 mb-2">الألوان</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {profile.brandAssets.brandColors.map((color, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border border-portal-card-border" style={{ backgroundColor: color }} />
                      <span className="text-xs text-natural-100" dir="ltr">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {profile.brandAssets.fonts && profile.brandAssets.fonts.length > 0 && (
              <div className="p-3 rounded-xl bg-white border border-portal-card-border">
                <p className="text-xs text-neutral-400 mb-1">الخطوط</p>
                <p className="text-sm text-natural-100">{profile.brandAssets.fonts.join("، ")}</p>
              </div>
            )}
            {profile.brandAssets.guidelinesUrl && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-portal-card-border">
                <Palette className="w-5 h-5 text-secondary-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-400">دليل الهوية</p>
                  <p className="text-xs text-secondary-500 truncate" dir="ltr">{profile.brandAssets.guidelinesUrl}</p>
                </div>
              </div>
            )}
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
