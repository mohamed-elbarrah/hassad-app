"use client";

import { useState, useCallback } from "react";
import { Ticket, Search, AlertTriangle, Clock, CheckCircle, Inbox, Ban } from "lucide-react";
import type { DisputeStatus, DisputePriority } from "@hassad/shared";
import { DISPUTE_STATUS_AR } from "@hassad/shared";
import {
  useGetAdminDisputesQuery,
  useGetDisputeStatsQuery,
} from "@/features/disputes/adminDisputesApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { Pagination } from "@/components/design-system/Pagination";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import { Input } from "@/components/design-system/Input";
import { Skeleton } from "@/components/design-system/Skeleton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { AdminDisputeCard } from "@/components/disputes/AdminDisputeCard";
import { DisputeEmptyState } from "@/components/disputes/DisputeEmptyState";

const PAGE_SIZE = 9;

// ─── Filter Configuration ──────────────────────────────────────────────────────

const STATUS_GROUPS: FilterGroup[] = [
  {
    key: "status",
    label: "الحالة",
    options: [
      { label: "الكل", value: "" },
      { label: DISPUTE_STATUS_AR.PENDING_APPROVAL, value: "PENDING_APPROVAL" },
      { label: DISPUTE_STATUS_AR.APPROVED, value: "APPROVED" },
      { label: DISPUTE_STATUS_AR.IN_PROGRESS, value: "IN_PROGRESS" },
      { label: DISPUTE_STATUS_AR.ESCALATED, value: "ESCALATED" },
      { label: DISPUTE_STATUS_AR.RESOLVED, value: "RESOLVED" },
      { label: DISPUTE_STATUS_AR.CLOSED, value: "CLOSED" },
    ],
  },
  {
    key: "priority",
    label: "الأولوية",
    options: [
      { label: "الكل", value: "" },
      { label: "عاجل", value: "URGENT" },
      { label: "عالي", value: "HIGH" },
      { label: "عادي", value: "NORMAL" },
      { label: "منخفض", value: "LOW" },
    ],
  },
];

// ─── Tab Configuration ────────────────────────────────────────────────────────

const TABS = [
  { value: "", label: "الكل", icon: Ticket },
  { value: "PENDING_APPROVAL", label: "بانتظار الموافقة", icon: Clock },
  { value: "ESCALATED", label: "تم التصعيد", icon: AlertTriangle },
  { value: "IN_PROGRESS", label: "نشطة", icon: Clock },
  { value: "RESOLVED", label: "تم الحل", icon: CheckCircle },
] as const;

export default function AdminDisputesPage() {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("");

  // Get filter values
  const statusFilter = activeFilters["status"]?.[0] ?? activeTab ?? "";
  const priorityFilter = activeFilters["priority"]?.[0] ?? "";

  // Fetch disputes
  const { data, isLoading } = useGetAdminDisputesQuery(
    {
      status: statusFilter as DisputeStatus | undefined,
      priority: (priorityFilter || undefined) as DisputePriority | undefined,
      page,
      limit: PAGE_SIZE,
    },
    { pollingInterval: 60_000 }
  );

  // Fetch stats
  const { data: stats } = useGetDisputeStatsQuery();

  const disputes = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const handleFilterChange = useCallback((groupKey: string, values: string[]) => {
    setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
    setPage(1);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setActiveFilters({});
    setPage(1);
  };

  // Filter by search locally
  const filtered = search
    ? disputes.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.client.name.toLowerCase().includes(search.toLowerCase()) ||
          d.pm.name.toLowerCase().includes(search.toLowerCase()) ||
          d.project.name.toLowerCase().includes(search.toLowerCase())
      )
    : disputes;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="إدارة النزاعات"
        description="مراجعة وإدارة جميع تذاكر النزاعات"
        icon={Ticket}
      />

      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          icon={Clock}
          label="بانتظار الموافقة"
          value={stats?.pendingApproval ?? 0}
          color="yellow"
        />
        <StatsCard
          icon={Ticket}
          label="نشطة"
          value={stats?.active ?? 0}
          color="blue"
        />
        <StatsCard
          icon={AlertTriangle}
          label="مصعدة"
          value={stats?.escalated ?? 0}
          color="red"
        />
        <StatsCard
          icon={CheckCircle}
          label="تم الحل"
          value={stats?.resolved ?? 0}
          color="green"
        />
        <StatsCard
          icon={Ban}
          label="مغلقة"
          value={stats?.closed ?? 0}
          color="gray"
        />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.value === ""
              ? total
              : disputes.filter((d) => d.status === tab.value).length;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
                {count > 0 && (
                  <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* ── Toolbar ────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 items-start mb-4">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
              <Input
                placeholder="ابحث في التذاكر..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pr-9 h-10"
              />
            </div>
            <FilterBar
              groups={STATUS_GROUPS}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* ── Disputes Grid ────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-[24px]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <DisputeEmptyState
              hasFilter={!!search || !!statusFilter || !!priorityFilter}
              canCreate={false}
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((dispute) => (
                  <AdminDisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>

              {/* ── Pagination ──────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Stats Card Component ─────────────────────────────────────────────────────

interface StatsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "yellow" | "blue" | "red" | "green" | "gray";
}

const STATS_COLORS = {
  yellow: { bg: "bg-yellow-100", icon: "text-yellow-600" },
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  red: { bg: "bg-red-100", icon: "text-red-600" },
  green: { bg: "bg-green-100", icon: "text-green-600" },
  gray: { bg: "bg-gray-100", icon: "text-gray-600" },
};

function StatsCard({ icon: Icon, label, value, color }: StatsCardProps) {
  const colors = STATS_COLORS[color];
  return (
    <SurfaceCard className="p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bg}`}>
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-natural-100">{value}</p>
          <p className="text-sm text-portal-note-text">{label}</p>
        </div>
      </div>
    </SurfaceCard>
  );
}