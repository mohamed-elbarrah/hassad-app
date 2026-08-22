import type { LucideIcon } from "lucide-react";
import { FileSignature, FileText } from "lucide-react";
import { RequestStatus } from "@hassad/shared";
import type { SalesPipelineItem } from "@/features/sales/salesApi";

export interface SalesPipelineWorkflowAction {
  kind: "proposal" | "contract";
  label: string;
  icon: LucideIcon;
}

export function getInitials(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getSalesPipelineDisplayName(request: SalesPipelineItem) {
  if (request.client?.intakeCompleted === false) {
    return request.client.user?.name || "عميل جديد";
  }

  return (
    request.contactName || request.client?.companyName || request.companyName
  );
}

export function getSalesPipelineCompanyName(request: SalesPipelineItem) {
  return request.client?.intakeCompleted === false
    ? "بانتظار استكمال بيانات العميل"
    : request.companyName;
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

export function getSalesPipelineWorkflowAction(
  request: SalesPipelineItem,
): SalesPipelineWorkflowAction | null {
  const hasProposal = Boolean(request.proposals?.[0]?.id);
  const hasContract = Boolean(request.contracts?.[0]?.id);

  switch (request.status) {
    case RequestStatus.PROPOSAL_IN_PROGRESS:
    case RequestStatus.PROPOSAL_SENT:
    case RequestStatus.NEGOTIATION:
      return {
        kind: "proposal",
        label: hasProposal ? "فتح العرض" : "إنشاء عرض",
        icon: FileText,
      };
    case RequestStatus.CONTRACT_PREPARATION:
    case RequestStatus.CONTRACT_SENT:
      return {
        kind: "contract",
        label: hasContract ? "فتح العقد" : "إنشاء عقد",
        icon: FileSignature,
      };
    default:
      return null;
  }
}

export function getDealValue(request: SalesPipelineItem) {
  return (
    request.contracts?.[0]?.totalValue ??
    request.proposals?.[0]?.totalPrice ??
    null
  );
}

export function getServicePreview(request: SalesPipelineItem) {
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
