"use client";

import { ContactLogType, ContractStatus } from "@hassad/shared";
import type { CreateRequestContactLogPayload } from "@/features/requests/requestsApi";
import type { SalesPipelineItem } from "@/features/sales/salesApi";
import { RequestContactLogDialog } from "@/components/request-detail/RequestContactLogDialog";
import { SalesContractSendAction } from "@/components/dashboard/sales/SalesContractSendAction";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getSalesPipelineWorkflowAction,
  isClosedRequest,
} from "./presentation";

const SALES_CONTACT_LOG_TYPES = [
  ContactLogType.CALL,
  ContactLogType.WHATSAPP,
  ContactLogType.MEETING,
] as const;

interface SalesPipelineActionsProps {
  request: SalesPipelineItem;
  onCreateProposal?: (request: SalesPipelineItem) => void;
  onEditProposal?: (request: SalesPipelineItem) => void;
  onCreateContract?: (request: SalesPipelineItem) => void;
  onEditContract?: (request: SalesPipelineItem) => void;
  onAddContactLog?: (
    request: SalesPipelineItem,
    payload: CreateRequestContactLogPayload,
  ) => Promise<void>;
  canAddContactLog?: boolean;
  isAddingContactLog?: boolean;
  className?: string;
}

export function SalesPipelineActions({
  request,
  onCreateProposal,
  onEditProposal,
  onCreateContract,
  onEditContract,
  onAddContactLog,
  canAddContactLog,
  isAddingContactLog,
  className,
}: SalesPipelineActionsProps) {
  const workflowAction = getSalesPipelineWorkflowAction(request);
  const hasProposal = Boolean(request.proposals?.[0]?.id);
  const hasContract = Boolean(request.contracts?.[0]?.id);
  const canUseWorkflowAction =
    workflowAction?.kind === "proposal"
      ? hasProposal
        ? Boolean(onEditProposal)
        : Boolean(onCreateProposal)
      : workflowAction?.kind === "contract"
        ? hasContract
          ? Boolean(onEditContract)
          : Boolean(onCreateContract)
        : false;

  const draftContractId = request.contracts?.find(
    (contract) => contract.status === ContractStatus.DRAFT,
  )?.id;

  function handleWorkflowAction() {
    if (!workflowAction) return;

    if (workflowAction.kind === "proposal") {
      if (hasProposal) {
        onEditProposal?.(request);
      } else {
        onCreateProposal?.(request);
      }
      return;
    }

    if (hasContract) {
      onEditContract?.(request);
    } else {
      onCreateContract?.(request);
    }
  }

  return (
    <div
      className={cn("flex flex-wrap items-center justify-end gap-2", className)}
    >
      {canAddContactLog && onAddContactLog ? (
        <RequestContactLogDialog
          allowedTypes={SALES_CONTACT_LOG_TYPES}
          isSubmitting={isAddingContactLog}
          onSubmit={(payload) => onAddContactLog(request, payload)}
        />
      ) : null}
      {draftContractId ? (
        <SalesContractSendAction
          contractId={draftContractId}
          className="px-3 text-xs"
        />
      ) : null}
      {workflowAction && canUseWorkflowAction ? (
        <Button
          type="button"
          variant={isClosedRequest(request.status) ? "outline" : "default"}
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={handleWorkflowAction}
        >
          <workflowAction.icon data-icon="inline-start" />
          {workflowAction.label}
        </Button>
      ) : null}
    </div>
  );
}
