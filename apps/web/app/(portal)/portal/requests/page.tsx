"use client";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { useGetPortalRequestsQuery } from "@/features/portal/portalApi";
import { DataTable } from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import {
  RequestRow,
  RequestsToolbar,
  type RequestsToolbarFilters,
} from "@/components/portal/requests";
import { resolveStatusGroup } from "@/lib/utils/requestStatus";

const PAGE_SIZE = 6;

export default function PortalRequestsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<RequestsToolbarFilters>({
    query: "",
    statusGroups: [],
  });

  const { data, isLoading, isError } = useGetPortalRequestsQuery(
    {
      page,
      limit: PAGE_SIZE,
    },
    { pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Derived: counts by status group for the current page. Used to
  //    populate the FilterBar's option counts so the user can see how
  //    many requests each filter would return before applying it.
  //    Page-local approximation — accurate site-wide counts would
  //    require a dedicated endpoint (deferred). ──────────────────────
  const countsByGroup = useMemo(() => {
    const map = new Map<ReturnType<typeof resolveStatusGroup>, number>();
    requests.forEach((r) => {
      const g = resolveStatusGroup(r.status);
      map.set(g, (map.get(g) ?? 0) + 1);
    });
    return map;
  }, [requests]);

  // ── Derived: filtered view of the current page. ────────────────────
  // The backend already paginates and sorts by date. We do client-side
  // filtering on top so the UI feels instant (no network round-trip per
  // keystroke). For paginated server-side sort this is the standard
  // pattern — sorting across pages would require a new endpoint, which
  // isn't needed yet.
  const view = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return requests.filter((req) => {
      if (
        filters.statusGroups.length > 0 &&
        !filters.statusGroups.includes(resolveStatusGroup(req.status))
      ) {
        return false;
      }
      if (q) {
        const haystack = [
          req.companyName,
          req.contactName,
          ...req.services.map((s) => s.nameAr ?? s.name),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [requests, filters]);

  // When the user changes filters, reset to page 1 so they don't get
  // stranded on an empty page-2 after narrowing the result set.
  const updateFilters = (next: RequestsToolbarFilters) => {
    setFilters(next);
    setPage(1);
  };

  const hasActiveFilter =
    filters.statusGroups.length > 0 || filters.query.length > 0;

  return (
    <div className="page-shell" dir="rtl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-natural-100">طلباتي</h1>
        <p className="text-portal-note-text text-sm">
          متابعة طلبات الخدمات التي قمت بتقديمها. سيتم تحويل الطلب إلى مشروع بعد
          توقيع العقد.
        </p>
      </div>

      {/* Toolbar (search + FilterBar) */}
      <RequestsToolbar
        value={filters}
        onChange={updateFilters}
        countsByGroup={countsByGroup}
      />

      {/* Table */}
      <DataTable
        columns={[
          { id: "action", label: "الإجراء", width: "140px" },
          { id: "status", label: "الحالة", width: "140px" },
          { id: "services", label: "الخدمات" },
          { id: "company", label: "الشركة", width: "200px" },
          { id: "date", label: "تاريخ الطلب", width: "140px" },
          { id: "expand", label: "", width: "44px" },
        ]}
        data={view}
        isLoading={isLoading}
        isError={isError}
        errorMessage="حدث خطأ أثناء تحميل الطلبات."
        skeletonRows={PAGE_SIZE}
        emptyState={{
          icon: Package,
          message: hasActiveFilter
            ? "لا توجد طلبات تطابق البحث"
            : "لا توجد طلبات حالياً",
          hint: hasActiveFilter
            ? "جرّب تغيير الفلتر أو مسح البحث لعرض جميع الطلبات."
            : "عند إرسال طلب جديد، سيظهر هنا لمتابعة حالته حتى اكتمال التوقيع.",
        }}
        renderRow={(request) => (
          <RequestRow key={request.id} request={request} />
        )}
      />

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
