"use client";

import { CampaignDashboard } from "@/components/dashboard/marketing/CampaignDashboard";
import { useAppSelector } from "@/lib/hooks";

export default function MarketingPage() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم التسويق</h1>
        <p className="text-muted-foreground mt-2">
          مرحباً {user?.name}، تتبع مهامك التسويقية وحملاتك الإعلانية من هنا.
        </p>
      </div>

      <CampaignDashboard />
    </div>
  );
}
