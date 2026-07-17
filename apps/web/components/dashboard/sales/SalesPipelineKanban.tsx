"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { RequestStatus } from "@hassad/shared";
import type { RequestItem } from "@/features/requests/requestsApi";
import {
  useGetRequestsQuery,
  useUpdateRequestStatusMutation,
} from "@/features/requests/requestsApi";
import { useGetProposalByIdQuery } from "@/features/proposals/proposalsApi";
import { useGetContractByIdQuery } from "@/features/contracts/contractsApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { SALES_PIPELINE_CONFIG } from "@/components/dashboard/kanban/configs/sales-pipeline";
import { SalesPipelineCardContent } from "@/components/dashboard/kanban/cards/SalesPipelineCardContent";
import { ProposalFormDialog } from "@/components/dashboard/sales/ProposalFormDialog";
import { CreateContractDialog } from "@/components/dashboard/sales/CreateContractDialog";

// ─── Error resolver ──────────────────────────────────────────────────────────

function resolveKanbanError(error: unknown): string {
  const e = error as FetchBaseQueryError | undefined;
  if (!e) return "حدث خطأ غير متوقع.";
  if (e.status === 401) return "انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.";
  if (e.status === 403) return "لا تملك صلاحية الوصول إلى بيانات الطلبات.";
  if (typeof e.status === "number" && e.status >= 500)
    return "خطأ في الخادم. يرجى المحاولة لاحقاً.";
  if (e.status === "FETCH_ERROR")
    return "تعذّر الاتصال بالخادم. تحقق من الشبكة.";
  return "فشل تحميل لوحة الطلبات.";
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SalesPipelineKanbanProps {
  filters?: Record<string, string>;
}

export function SalesPipelineKanban({
  filters: externalFilters,
}: SalesPipelineKanbanProps = {}) {
  const [updateRequestStatus] = useUpdateRequestStatusMutation();

  // ── Pipeline dialog state ────────────────────────────────────────────
  const [pipelineDialog, setPipelineDialog] = useState<{
    type: "proposal" | "contract";
    mode: "create" | "edit";
    requestId: string;
    proposalId?: string;
    contractId?: string;
  } | null>(null);

  const queryParams = useMemo(
    () => ({ limit: 100, ...externalFilters }),
    [externalFilters],
  );

  const { data, isLoading, isError, error } = useGetRequestsQuery(
    queryParams,
    { pollingInterval: 30_000 },
  );

  // ── Fetch proposal/contract data for edit modes ──────────────────────
  const editProposalId =
    pipelineDialog?.type === "proposal" && pipelineDialog?.mode === "edit"
      ? pipelineDialog.proposalId
      : undefined;
  const editContractId =
    pipelineDialog?.type === "contract" && pipelineDialog?.mode === "edit"
      ? pipelineDialog.contractId
      : undefined;

  const { data: editProposalData } = useGetProposalByIdQuery(editProposalId!, {
    skip: !editProposalId,
  });
  const { data: editContractData } = useGetContractByIdQuery(editContractId!, {
    skip: !editContractId,
  });

  // ── Pipeline action handlers ────────────────────────────────────────
  const handleCreateProposal = useCallback((request: RequestItem) => {
    setPipelineDialog({
      type: "proposal",
      mode: "create",
      requestId: request.id,
    });
  }, []);

  const handleEditProposal = useCallback((request: RequestItem) => {
    const proposalId = request.proposals?.[0]?.id;
    if (!proposalId) {
      toast.error("لا يوجد عرض مرتبط بهذا الطلب");
      return;
    }
    setPipelineDialog({
      type: "proposal",
      mode: "edit",
      requestId: request.id,
      proposalId,
    });
  }, []);

  const handleCreateContract = useCallback((request: RequestItem) => {
    setPipelineDialog({
      type: "contract",
      mode: "create",
      requestId: request.id,
    });
  }, []);

  const handleEditContract = useCallback((request: RequestItem) => {
    const contractId = request.contracts?.[0]?.id;
    if (!contractId) {
      toast.error("لا يوجد عقد مرتبط بهذا الطلب");
      return;
    }
    setPipelineDialog({
      type: "contract",
      mode: "edit",
      requestId: request.id,
      contractId,
    });
  }, []);

  const closePipelineDialog = useCallback(() => {
    setPipelineDialog(null);
  }, []);

  // ── Drag end handler ─────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (itemId: string, _fromStage: string, toStage: string) => {
      try {
        await updateRequestStatus({
          id: itemId,
          toStatus: toStage as RequestStatus,
        }).unwrap();
      } catch (err: unknown) {
        const message =
          (err as { data?: { message?: string } })?.data?.message ??
          "فشل تحديث حالة الطلب";
        toast.error(message);
      }
    },
    [updateRequestStatus],
  );

  // ── Render card ──────────────────────────────────────────────────────
  const renderCard = useCallback(
    (request: RequestItem, _options: { isOverlay: boolean }) => (
      <SalesPipelineCardContent
        request={request}
        onCreateProposal={handleCreateProposal}
        onEditProposal={handleEditProposal}
        onCreateContract={handleCreateContract}
        onEditContract={handleEditContract}
      />
    ),
    [
      handleCreateProposal,
      handleEditProposal,
      handleCreateContract,
      handleEditContract,
    ],
  );

  const requests = data ?? [];

  return (
    <>
      <KanbanBoard
        config={SALES_PIPELINE_CONFIG}
        items={requests}
        getItemStage={(r) => r.status}
        renderCard={renderCard}
        onDragEnd={handleDragEnd}
        isLoading={isLoading}
        isError={isError}
        errorMessage={resolveKanbanError(error)}
        emptyMessage="لا يوجد أي طلب بعد — سيظهر هنا بعد تقديم طلبات جديدة عبر بوابة العملاء"
      />

      {/* ── Pipeline Dialogs ──────────────────────────────────────── */}
      {pipelineDialog?.type === "proposal" &&
        pipelineDialog.mode === "create" && (
          <ProposalFormDialog
            mode="create"
            preSelectedRequestId={pipelineDialog.requestId}
            open={true}
            onOpenChange={(open) => {
              if (!open) closePipelineDialog();
            }}
          />
        )}

      {pipelineDialog?.type === "proposal" &&
        pipelineDialog.mode === "edit" &&
        editProposalData && (
          <ProposalFormDialog
            mode="edit"
            proposal={editProposalData}
            open={true}
            onOpenChange={(open) => {
              if (!open) closePipelineDialog();
            }}
          />
        )}

      {pipelineDialog?.type === "contract" &&
        pipelineDialog.mode === "create" && (
          <CreateContractDialog
            mode="create"
            preSelectedRequestId={pipelineDialog.requestId}
            open={true}
            onOpenChange={(open) => {
              if (!open) closePipelineDialog();
            }}
          />
        )}

      {pipelineDialog?.type === "contract" &&
        pipelineDialog.mode === "edit" &&
        editContractData && (
          <CreateContractDialog
            mode="edit"
            contract={editContractData}
            open={true}
            onOpenChange={(open) => {
              if (!open) closePipelineDialog();
            }}
          />
        )}
    </>
  );
}
