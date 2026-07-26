"use client";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Inbox, TrendingUp } from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetPortalCampaignsQuery,
  type PortalCampaign,
} from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { ErrorState } from "@/components/design-system/EmptyState";
import {
  CampaignsToolbar,
  renderCampaignRowCells,
} from "@/components/portal/campaigns";

export default function PortalCampaignsPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const statusFilter = activeFilters["status"]?.[0] ?? "";

  const {
    data: campaigns,
    isLoading,
    isError,
    refetch,
  } = useGetPortalCampaignsQuery(undefined, {
    skip: !clientId,
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });

  const filtered = useMemo<PortalCampaign[]>(() => {
    if (!campaigns) return [];
    const q = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) || c.platform.toLowerCase().includes(q)
      );
    });
  }, [campaigns, search, statusFilter]);

  const handleFilterChange = useCallback((key: string, values: string[]) => {
    setActiveFilters((prev) => ({ ...prev, [key]: values }));
  }, []);

  const handleRowActivate = useCallback(
    (c: PortalCampaign) => {
      router.push(`/portal/campaigns/${c.id}`);
    },
    [router],
  );

  const hasActiveSearchOrFilter =
    search.trim().length > 0 ||
    Object.values(activeFilters).some((v) => v.length > 0);

  if (!clientId) {
    return (
      <div className="page-shell" dir="rtl">
        <PageIntro
          title="الحملات الإعلانية"
          description="جميع الحملات الإعلانية المرتبطة بحسابك مع مؤشرات الأداء الرئيسية لكل حملة."
          icon={TrendingUp}
        />
        <div className="rounded-2xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-6 text-center">
          <p className="text-base font-medium text-danger-700">
            لم يتم ربط حسابك بملف عميل.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="الحملات الإعلانية"
        description="جميع الحملات الإعلانية المرتبطة بحسابك مع مؤشرات الأداء الرئيسية لكل حملة."
        icon={TrendingUp}
      />

      {isError && !isLoading ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <CampaignsToolbar
            search={search}
            onSearchChange={setSearch}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            campaigns={campaigns}
            totalCount={campaigns?.length ?? 0}
            visibleCount={filtered.length}
          />

          <DataTable
            columns={[
              { id: "name", label: "الحملة" },
              { id: "status", label: "الحالة" },
              { id: "period", label: "الفترة" },
              { id: "impressions", label: "الانطباعات", align: "left" },
              { id: "clicks", label: "النقرات", align: "left" },
              { id: "conversions", label: "التحويلات", align: "left" },
              { id: "ctr", label: "CTR", align: "left" },
              { id: "roas", label: "ROAS", align: "left" },
              {
                id: "budget",
                label: "الميزانية",
                align: "left",
                width: "180px",
              },
            ]}
            data={filtered}
            isLoading={isLoading}
            isError={false}
            skeletonRows={6}
            emptyState={{
              icon: Inbox,
              message: hasActiveSearchOrFilter
                ? "لا توجد حملات مطابقة"
                : "لا توجد حملات حالياً.",
              hint: hasActiveSearchOrFilter
                ? "جرّب كلمات بحث مختلفة أو امسح عوامل التصفية."
                : "ستظهر هنا جميع الحملات الإعلانية المرتبطة بحسابك بمجرد إطلاقها.",
            }}
            onRowActivate={handleRowActivate}
            renderCells={(c) => renderCampaignRowCells(c)}
          />
        </>
      )}
    </div>
  );
}
