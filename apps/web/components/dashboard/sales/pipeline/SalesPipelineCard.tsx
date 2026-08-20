"use client";

import Link from "next/link";
import {
  Building2,
  CircleDollarSign,
  ClipboardList,
  Phone,
  UserRound,
} from "lucide-react";
import { REQUEST_STATUS_AR } from "@hassad/shared";
import type { CreateRequestContactLogPayload } from "@/features/requests/requestsApi";
import type { SalesPipelineItem } from "@/features/sales/salesApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SalesPipelineActions } from "./SalesPipelineActions";
import {
  getDealValue,
  getInitials,
  getRequestStatusBadgeVariant,
  getSalesPipelineDisplayName,
  getServicePreview,
} from "./presentation";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";

interface SalesPipelineCardProps {
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
}

export function SalesPipelineCard({
  request,
  onCreateProposal,
  onEditProposal,
  onCreateContract,
  onEditContract,
  onAddContactLog,
  canAddContactLog,
  isAddingContactLog,
}: SalesPipelineCardProps) {
  const displayName = getSalesPipelineDisplayName(request);
  const dealValue = getDealValue(request);

  return (
    <div className="flex flex-col gap-2.5">
      <Link
        href={`/dashboard/sales/requests/${request.id}`}
        className="flex min-w-0 items-center gap-2"
      >
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="text-xs">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {displayName}
          </span>
          <span className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
            <Building2 className="size-3 shrink-0" />
            {request.companyName}
          </span>
        </div>
        <Badge
          variant={getRequestStatusBadgeVariant(request.status)}
          className="shrink-0 px-2 py-0 text-xs"
        >
          {REQUEST_STATUS_AR[request.status]}
        </Badge>
      </Link>

      <div className="flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1 truncate">
          <ClipboardList className="size-3 shrink-0" />
          {getServicePreview(request)}
        </span>
        {dealValue !== null && (
          <span className="flex shrink-0 items-center gap-1 font-medium text-foreground">
            <CircleDollarSign className="size-3" />
            {formatCurrency(dealValue)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1 truncate" dir="ltr">
          <Phone className="size-3 shrink-0" />
          {request.phoneWhatsapp}
        </span>
        <span className="flex shrink-0 items-center gap-1 truncate">
          <UserRound className="size-3" />
          {request.assignee?.name || "غير مسند"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          محاولات التواصل: {formatNumber(request.contactAttemptCount)}
        </span>
        <span>
          {request.lastContactAt
            ? `آخر تواصل ${formatRelativeTime(request.lastContactAt)}`
            : "لم يتم التواصل بعد"}
        </span>
      </div>

      <SalesPipelineActions
        request={request}
        onCreateProposal={onCreateProposal}
        onEditProposal={onEditProposal}
        onCreateContract={onCreateContract}
        onEditContract={onEditContract}
        onAddContactLog={onAddContactLog}
        canAddContactLog={canAddContactLog}
        isAddingContactLog={isAddingContactLog}
        className="border-t pt-2"
      />
    </div>
  );
}
