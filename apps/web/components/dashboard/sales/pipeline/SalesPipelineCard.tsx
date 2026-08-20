"use client";

import Link from "next/link";
import {
  ArrowUpLeft,
  Building2,
  CircleDollarSign,
  ClipboardList,
  FileSignature,
  FileText,
  FolderKanban,
  Phone,
  UserRound,
} from "lucide-react";
import { REQUEST_STATUS_AR, RequestStatus } from "@hassad/shared";
import type { RequestItem } from "@/features/requests/requestsApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatRelativeTime } from "@/lib/format";

function getInitials(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getRequestStatusBadgeVariant(
  status: RequestStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case RequestStatus.SIGNED:
    case RequestStatus.PROJECT_CREATED:
      return "secondary";
    case RequestStatus.CANCELLED:
      return "destructive";
    case RequestStatus.PROPOSAL_SENT:
    case RequestStatus.NEGOTIATION:
    case RequestStatus.CONTRACT_SENT:
      return "default";
    default:
      return "outline";
  }
}

export function isClosedRequest(status: RequestStatus) {
  return (
    status === RequestStatus.PROJECT_CREATED ||
    status === RequestStatus.CANCELLED
  );
}

export function getSalesPipelineAction(request: RequestItem) {
  const proposalId = request.proposals?.[0]?.id;
  const contractId = request.contracts?.[0]?.id;

  switch (request.status) {
    case RequestStatus.PROPOSAL_IN_PROGRESS:
      return proposalId
        ? {
            href: `/dashboard/sales/proposals/${proposalId}`,
            label: "فتح العرض",
            icon: FileText,
          }
        : {
            href: `/dashboard/sales/requests/${request.id}`,
            label: "إكمال العرض",
            icon: FileText,
          };
    case RequestStatus.PROPOSAL_SENT:
    case RequestStatus.NEGOTIATION:
      return proposalId
        ? {
            href: `/dashboard/sales/proposals/${proposalId}`,
            label: "مراجعة العرض",
            icon: FileText,
          }
        : {
            href: `/dashboard/sales/requests/${request.id}`,
            label: "متابعة العرض",
            icon: ArrowUpLeft,
          };
    case RequestStatus.CONTRACT_PREPARATION:
      return contractId
        ? {
            href: `/dashboard/sales/contracts/${contractId}`,
            label: "فتح العقد",
            icon: FileSignature,
          }
        : {
            href: `/dashboard/sales/requests/${request.id}`,
            label: "تجهيز العقد",
            icon: FileSignature,
          };
    case RequestStatus.CONTRACT_SENT:
      return contractId
        ? {
            href: `/dashboard/sales/contracts/${contractId}`,
            label: "مراجعة العقد",
            icon: FileSignature,
          }
        : {
            href: `/dashboard/sales/requests/${request.id}`,
            label: "متابعة العقد",
            icon: ArrowUpLeft,
          };
    case RequestStatus.PROJECT_CREATED:
      return {
        href: `/dashboard/sales/requests/${request.id}`,
        label: "فتح الطلب",
        icon: FolderKanban,
      };
    case RequestStatus.SIGNED:
      return {
        href: `/dashboard/sales/requests/${request.id}`,
        label: "فتح الصفقة",
        icon: ClipboardList,
      };
    default:
      return {
        href: `/dashboard/sales/requests/${request.id}`,
        label: "فتح الطلب",
        icon: ArrowUpLeft,
      };
  }
}

function getDealValue(request: RequestItem) {
  const contractValue = request.contracts?.[0]?.totalValue;
  const proposalValue = request.proposals?.[0]?.totalPrice;
  return contractValue ?? proposalValue ?? null;
}

function getServicePreview(request: RequestItem) {
  const names =
    request.services
      ?.map((item) => item.service.nameAr || item.service.name)
      .filter(Boolean) ?? [];

  if (names.length === 0) {
    return "بدون خدمات محددة";
  }

  if (names.length <= 2) {
    return names.join("، ");
  }

  return `${names.slice(0, 2).join("، ")} +${names.length - 2}`;
}

interface SalesPipelineCardProps {
  request: RequestItem;
  onCreateProposal?: (request: RequestItem) => void;
  onEditProposal?: (request: RequestItem) => void;
  onCreateContract?: (request: RequestItem) => void;
  onEditContract?: (request: RequestItem) => void;
}

export function SalesPipelineCard({
  request,
  onCreateProposal,
  onEditProposal,
  onCreateContract,
  onEditContract,
}: SalesPipelineCardProps) {
  const action = getSalesPipelineAction(request);
  const relatedProposalId = request.proposals?.[0]?.id;
  const relatedContractId = request.contracts?.[0]?.id;

  const workflowAction =
    request.status === RequestStatus.PROPOSAL_IN_PROGRESS
      ? relatedProposalId && onEditProposal
        ? { label: "فتح العرض", onClick: onEditProposal, icon: FileText }
        : onCreateProposal
          ? { label: "إنشاء عرض", onClick: onCreateProposal, icon: FileText }
          : null
      : request.status === RequestStatus.PROPOSAL_SENT ||
          request.status === RequestStatus.NEGOTIATION
        ? relatedProposalId && onEditProposal
          ? { label: "فتح العرض", onClick: onEditProposal, icon: FileText }
          : onCreateProposal
            ? { label: "إنشاء عرض", onClick: onCreateProposal, icon: FileText }
            : null
        : request.status === RequestStatus.CONTRACT_PREPARATION
          ? relatedContractId && onEditContract
            ? {
                label: "فتح العقد",
                onClick: onEditContract,
                icon: FileSignature,
              }
            : onCreateContract
              ? {
                  label: "إنشاء عقد",
                  onClick: onCreateContract,
                  icon: FileSignature,
                }
              : null
          : request.status === RequestStatus.CONTRACT_SENT
            ? relatedContractId && onEditContract
              ? {
                  label: "فتح العقد",
                  onClick: onEditContract,
                  icon: FileSignature,
                }
              : onCreateContract
                ? {
                    label: "إنشاء عقد",
                    onClick: onCreateContract,
                    icon: FileSignature,
                  }
                : null
            : null;
  const displayName =
    request.contactName || request.client?.companyName || request.companyName;
  const isClosed = isClosedRequest(request.status);

  const dealValue = getDealValue(request);

  return (
    <div className="flex flex-col gap-2.5">
      <Link
        href={`/dashboard/sales/requests/${request.id}`}
        className="flex min-w-0 items-center gap-2"
      >
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="text-[11px]">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {displayName}
          </span>
          <span className="flex min-w-0 items-center gap-1 truncate text-[11px] text-muted-foreground">
            <Building2 className="size-3 shrink-0" />
            {request.companyName}
          </span>
        </div>
        <Badge
          variant={getRequestStatusBadgeVariant(request.status)}
          className="shrink-0 px-2 py-0 text-[10px]"
        >
          {REQUEST_STATUS_AR[request.status]}
        </Badge>
      </Link>

      <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] text-muted-foreground">
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

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1 truncate" dir="ltr">
          <Phone className="size-3 shrink-0" />
          {request.phoneWhatsapp}
        </span>
        <span className="flex shrink-0 items-center gap-1 truncate">
          <UserRound className="size-3" />
          {request.assignee?.name || "غير مسند"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-2 text-[11px] text-muted-foreground">
        <span>آخر تحديث {formatRelativeTime(request.updatedAt)}</span>
        {workflowAction ? (
          <Button
            type="button"
            variant={isClosed ? "outline" : "default"}
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => workflowAction.onClick(request)}
          >
            <workflowAction.icon data-icon="inline-start" />
            {workflowAction.label}
          </Button>
        ) : (
          <Button
            asChild
            variant={isClosed ? "outline" : "default"}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            <Link href={action.href}>
              <action.icon data-icon="inline-start" />
              {action.label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
