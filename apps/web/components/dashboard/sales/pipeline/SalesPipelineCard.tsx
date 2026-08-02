"use client";

import { useRouter } from "next/navigation";
import {
  ArrowUpLeft,
  Building2,
  ClipboardList,
  FileSignature,
  FileText,
  FolderKanban,
  Phone,
} from "lucide-react";
import { REQUEST_STATUS_AR, RequestStatus } from "@hassad/shared";
import type { RequestItem } from "@/features/requests/requestsApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";

function getInitials(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getRequestStatusBadgeVariant(status: RequestStatus) {
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
    status === RequestStatus.SIGNED ||
    status === RequestStatus.PROJECT_CREATED ||
    status === RequestStatus.CANCELLED
  );
}

function getPrimaryAction(request: RequestItem) {
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

export function SalesPipelineCard({ request }: { request: RequestItem }) {
  const router = useRouter();
  const action = getPrimaryAction(request);
  const displayName = request.contactName || request.client?.companyName || request.companyName;
  const isClosed = isClosedRequest(request.status);

  function openRequest() {
    router.push(`/dashboard/sales/requests/${request.id}`);
  }

  return (
    <div
      className="flex flex-col gap-4"
      onClick={openRequest}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openRequest();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="-m-4 flex cursor-pointer flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-11">
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-semibold text-foreground">
                {displayName}
              </span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="size-4 shrink-0" />
                <span className="truncate">{request.companyName}</span>
              </div>
            </div>
          </div>
          <Badge variant={getRequestStatusBadgeVariant(request.status)}>
            {REQUEST_STATUS_AR[request.status]}
          </Badge>
        </div>

        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="size-4 shrink-0" />
            <span className="truncate">{getServicePreview(request)}</span>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Phone className="size-4 shrink-0" />
            <span dir="ltr" className="truncate">
              {request.phoneWhatsapp}
            </span>
          </div>
          <div className="truncate">
            آخر تحديث {formatRelativeTime(request.updatedAt)}
          </div>
        </div>
      </div>

      <Button
        asChild
        variant={isClosed ? "outline" : "default"}
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <a href={action.href}>
          <action.icon data-icon="inline-start" />
          {action.label}
        </a>
      </Button>
    </div>
  );
}
