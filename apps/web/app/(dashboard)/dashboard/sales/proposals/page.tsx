"use client";

import { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { useGetProposalsQuery } from "@/features/proposals/proposalsApi";
import type { ProposalListItem } from "@/features/proposals/proposalsApi";
import { DataTable } from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { ProposalFormDialog } from "@/components/dashboard/sales/ProposalFormDialog";
import { CreateContractDialog } from "@/components/dashboard/sales/CreateContractDialog";
import { renderProposalRowCells } from "@/components/dashboard/sales/ProposalRow";
import { SalesPageHeader } from "@/components/dashboard/sales/shared/SalesPageHeader";
import { SalesListToolbar } from "@/components/dashboard/sales/shared/SalesListToolbar";
import type { FilterGroup } from "@/components/design-system/FilterBar";
import { ProposalStatus } from "@hassad/shared";

const PAGE_SIZE = 20;

const STATUS_FILTERS: FilterGroup[] = [
  {
    key: "status",
    label: "الحالة",
    options: [
      { label: "الكل", value: "" },
      { label: "مسودة", value: ProposalStatus.DRAFT },
      { label: "مرسل", value: ProposalStatus.SENT },
      { label: "معتمد", value: ProposalStatus.APPROVED },
      { label: "بحاجة تعديل", value: ProposalStatus.REVISION_REQUESTED },
      { label: "مرفوض", value: ProposalStatus.REJECTED },
    ],
  },
];

export default function ProposalsPage() {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string[]>
  >({});
  const [page, setPage] = useState(1);

  const statusFilter = activeFilters["status"]?.[0] ?? "";

  const { data, isLoading, isError } = useGetProposalsQuery({
    search: search || undefined,
    status: (statusFilter as ProposalStatus) || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const proposals = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // ── Dialogs ──────────────────────────────────────────────────────
  const [editProposal, setEditProposal] = useState<ProposalListItem | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [contractDialogProposalId, setContractDialogProposalId] = useState<
    string | null
  >(null);

  const handleEdit = useCallback((proposal: ProposalListItem) => {
    setEditProposal(proposal);
    setEditOpen(true);
  }, []);

  const handleCreateContract = useCallback((proposalId: string) => {
    setContractDialogProposalId(proposalId);
  }, []);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback(
    (groupKey: string, values: string[]) => {
      setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
      setPage(1);
    },
    [],
  );

  const hasActiveFilter = search || statusFilter;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <SalesPageHeader
        title="العروض الفنية"
        description="إدارة العروض الفنية للعملاء، تتبع حالتها، وإنشاء العقود من العروض المعتمدة."
        icon={FileText}
      />

      <SalesListToolbar
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="ابحث عن عرض..."
        filterGroups={STATUS_FILTERS}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        countLabel="عرض"
        count={proposals.length}
      />

      <DataTable
        columns={[
          { id: "client", label: "العميل / العميل المحتمل" },
          { id: "price", label: "السعر" },
          { id: "createdAt", label: "تاريخ الإنشاء" },
          { id: "status", label: "الحالة" },
          { id: "actions", label: "إجراءات", align: "left" },
        ]}
        data={proposals}
        isLoading={isLoading}
        isError={isError}
        errorMessage="حدث خطأ أثناء تحميل العروض الفنية."
        skeletonRows={8}
        emptyState={{
          icon: FileText,
          message: hasActiveFilter
            ? "لا توجد عروض تطابق البحث"
            : "لا توجد عروض بعد.",
          hint: hasActiveFilter
            ? "جرّب كلمات بحث مختلفة أو امسح عوامل التصفية."
            : "أنشئ عرضاً فنياً جديداً من صفحة لوحة المبيعات.",
        }}
        renderCells={(proposal) =>
          renderProposalRowCells(proposal, {
            onEdit: handleEdit,
            onCreateContract: handleCreateContract,
          })
        }
      />

      {!isLoading && !isError && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Edit dialog */}
      {editProposal && (
        <ProposalFormDialog
          mode="edit"
          proposal={editProposal}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      {/* Create contract dialog */}
      {contractDialogProposalId && (
        <CreateContractDialog
          key={contractDialogProposalId}
          proposalId={contractDialogProposalId}
        />
      )}
    </div>
  );
}
