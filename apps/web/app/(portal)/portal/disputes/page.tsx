"use client";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Ticket, Search, Plus, Filter, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useGetClientDisputesQuery,
  useCreateDisputeMutation,
} from "@/features/portal/portalApi";
import { DISPUTE_STATUS_AR, DisputeStatus } from "@hassad/shared";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pagination } from "@/components/design-system/Pagination";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import { Input } from "@/components/design-system/Input";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  DisputeCard,
  DisputeEmptyState,
  NewDisputeDialog,
} from "@/components/disputes";

const STATUS_GROUPS: FilterGroup[] = [
  {
    key: "status",
    label: "الحالة",
    options: [
      { label: "الكل", value: "" },
      { label: "بانتظار الموافقة", value: DisputeStatus.PENDING_APPROVAL },
      { label: "تمت الموافقة", value: DisputeStatus.APPROVED },
      { label: "قيد المعالجة", value: DisputeStatus.IN_PROGRESS },
      { label: "بانتظار تأكيدي", value: DisputeStatus.PENDING_CLIENT },
      { label: "تم التصعيد", value: DisputeStatus.ESCALATED },
      { label: "تم الحل", value: DisputeStatus.RESOLVED },
      { label: "مغلق", value: DisputeStatus.CLOSED },
    ],
  },
];

const PAGE_SIZE = 9;

export default function PortalDisputesPage() {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("projectId") || undefined;

  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isNewDisputeOpen, setIsNewDisputeOpen] = useState(!!projectIdFromUrl);

  const statusFilter = activeFilters["status"]?.[0] ?? "";

  const { data, isLoading, isError, refetch } = useGetClientDisputesQuery(
    {
      status: statusFilter as DisputeStatus | undefined,
      page,
      limit: PAGE_SIZE,
    },
    { pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );

  const [createDispute, { isLoading: isCreating }] = useCreateDisputeMutation();

  const disputes = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const handleFilterChange = useCallback(
    (groupKey: string, values: string[]) => {
      setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
      setPage(1);
    },
    [],
  );

  // Filter by search locally
  const filtered = search
    ? disputes.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.project.name.toLowerCase().includes(search.toLowerCase()),
      )
    : disputes;

  const handleCreateDispute = async (
    input: import("@hassad/shared").CreateDisputeInput,
    files?: File[],
  ) => {
    try {
      await createDispute({ ...input, files }).unwrap();
      toast.success("تم إرسال التذكرة", {
        description: "تم استلام تذكرتك. سيتم مراجعتها من قبل الإدارة.",
      });
      setIsNewDisputeOpen(false);
      refetch();
    } catch (error) {
      const message =
        error?.data?.error?.message || "حدث خطأ أثناء إرسال التذكرة";
      toast.error("خطأ", {
        description: message,
      });
    }
  };

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="نزاعاتي"
        description="تتبع جميع تذاكر النزاع الخاصة بك، راقب حالتها، وتواصل مع فريق المشروع."
        icon={Ticket}
      />

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FilterBar
            groups={STATUS_GROUPS}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
          <ActionButton
            variant="primary"
            size="sm"
            onClick={() => setIsNewDisputeOpen(true)}
            className="h-10 rounded-xl px-4 gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            تذكرة جديدة
          </ActionButton>
        </div>
      </div>

      {/* ── Disputes Grid ──────────────────────────────────────────────────── */}
      {isError ? (
        <SurfaceCard>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-danger-500 mb-4" />
            <p className="text-lg font-medium text-natural-100 mb-2">
              تعذر تحميل التذاكر
            </p>
            <ActionButton variant="primary" onClick={() => refetch()}>
              إعادة المحاولة
            </ActionButton>
          </div>
        </SurfaceCard>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[24px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <DisputeEmptyState
          hasFilter={!!search || !!statusFilter}
          onCreateNew={() => setIsNewDisputeOpen(true)}
          canCreate={true}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((dispute) => (
              <DisputeCard key={dispute.id} dispute={dispute} />
            ))}
          </div>

          {/* ── Pagination ──────────────────────────────────────────────── */}
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

      {/* ── New Dispute Dialog ─────────────────────────────────────────────── */}
      <NewDisputeDialog
        isOpen={isNewDisputeOpen}
        onClose={() => setIsNewDisputeOpen(false)}
        onSubmit={handleCreateDispute}
        isLoading={isCreating}
        projectId={projectIdFromUrl || undefined}
      />
    </div>
  );
}
