"use client";

import { useState, useCallback } from "react";
import { Ticket, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useGetPmDisputesQuery } from "@/features/disputes/pmDisputesApi";
import type { DisputeStatus } from "@hassad/shared";

import { PageIntro } from "@/components/design-system/PageIntro";
import { Pagination } from "@/components/design-system/Pagination";
import { type FilterGroup } from "@/components/design-system/FilterBar";

import { Skeleton } from "@/components/design-system/Skeleton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { PmDisputeCard } from "@/components/disputes/PmDisputeCard";
import { DisputeEmptyState } from "@/components/disputes/DisputeEmptyState";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { PmListToolbar } from "@/components/dashboard/pm/shared/PmListToolbar";

const STATUS_GROUPS: FilterGroup[] = [
  {
    key: "status",
    label: "الحالة",
    options: [
      { label: "الكل", value: "" },
      { label: "بانتظار البدء", value: "APPROVED" },
      { label: "قيد المعالجة", value: "IN_PROGRESS" },
      { label: "بانتظار تأكيد العميل", value: "PENDING_CLIENT" },
      { label: "تم التصعيد", value: "ESCALATED" },
      { label: "تم الحل", value: "RESOLVED" },
      { label: "مغلق", value: "CLOSED" },
    ],
  },
];

const PAGE_SIZE = 9;

// ─── Tab Configuration ────────────────────────────────────────────────────────

const TABS = [
  { value: "", label: "الكل", icon: Ticket },
  { value: "APPROVED", label: "جديدة", icon: Clock },
  { value: "IN_PROGRESS", label: "قيد المعالجة", icon: Clock },
  { value: "ESCALATED", label: "تم التصعيد", icon: AlertTriangle },
  { value: "RESOLVED", label: "تم الحل", icon: CheckCircle },
] as const;

export default function PmDisputesPage() {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("");

  const statusFilter = activeFilters["status"]?.[0] ?? activeTab ?? "";

  const { data, isLoading } = useGetPmDisputesQuery(
    {
      status: statusFilter as DisputeStatus | undefined,
      page,
      limit: PAGE_SIZE,
    },
    { pollingInterval: 60_000 },
  );

  const disputes = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  // Count by status for tab badges
  const statusCounts = {
    APPROVED: disputes.filter((d) => d.status === "APPROVED").length,
    IN_PROGRESS: disputes.filter((d) => d.status === "IN_PROGRESS").length,
    ESCALATED: disputes.filter((d) => d.status === "ESCALATED").length,
  };

  const handleFilterChange = useCallback(
    (groupKey: string, values: string[]) => {
      setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
      setPage(1);
    },
    [],
  );

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
          d.project.name.toLowerCase().includes(search.toLowerCase()),
      )
    : disputes;

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="النزاعات"
        description="عرض وإدارة النزاعات المفتوحة ضدك من قبل العملاء. تابع التذاكر ورد على استفسارات العملاء."
        icon={Ticket}
      />

      {/* ── Quick Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SurfaceCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-action-blue-soft">
              <Clock className="h-5 w-5 text-action-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-natural-100">
                {statusCounts.APPROVED + statusCounts.IN_PROGRESS}
              </p>
              <p className="text-sm text-portal-note-text">تذاكر نشطة</p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-100">
              <AlertTriangle className="h-5 w-5 text-danger-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-natural-100">
                {statusCounts.ESCALATED}
              </p>
              <p className="text-sm text-portal-note-text">تم التصعيد</p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-natural-100">
                {total -
                  statusCounts.APPROVED -
                  statusCounts.IN_PROGRESS -
                  statusCounts.ESCALATED}
              </p>
              <p className="text-sm text-portal-note-text">تم الحل / مغلق</p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.value === ""
                ? total
                : disputes.filter((d) => d.status === tab.value).length;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
                {count > 0 && (
                  <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* ── Toolbar ────────────────────────────────────────────────────── */}
          <div className="mb-4">
            <PmListToolbar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="ابحث في التذاكر..."
              filterGroups={STATUS_GROUPS}
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
              hasFilter={!!search || !!statusFilter}
              canCreate={false}
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((dispute) => (
                  <PmDisputeCard key={dispute.id} dispute={dispute} />
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
