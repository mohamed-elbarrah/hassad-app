import { IsIn, IsOptional, IsString } from "class-validator";
import { BusinessType, ClientSource } from "@hassad/shared";

export const CRM_OVERVIEW_BOARD_FILTERS = ["all", "leads", "orders"] as const;
export type CrmOverviewBoardFilter =
  (typeof CRM_OVERVIEW_BOARD_FILTERS)[number];

export const CRM_OVERVIEW_KINDS = ["lead", "order"] as const;
export type CrmOverviewKind = (typeof CRM_OVERVIEW_KINDS)[number];

export const CRM_OVERVIEW_STATUSES = [
  "NEW",
  "SCHEDULED",
  "DONE",
  "FAILED",
  "SENT",
  "NEGOTIATION",
  "APPROVED",
  "REJECTED",
  "CONTRACT_SENT",
  "SIGNED",
  "ACTIVE",
  "CANCELLED",
] as const;
export type CrmOverviewStatus = (typeof CRM_OVERVIEW_STATUSES)[number];

export class CrmOverviewQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(CRM_OVERVIEW_BOARD_FILTERS)
  filter?: CrmOverviewBoardFilter;
}

export class CrmOverviewRecordDto {
  id: string;
  kind: CrmOverviewKind;
  status: CrmOverviewStatus;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  businessName: string;
  businessType: BusinessType;
  source: ClientSource;
  owner: string;
  serviceLine: string;
  note: string;
  lastActivityAt: string;
  createdAt: string;
  attemptCount: number;
  requiresNote: boolean;
  proposalId?: string | null;
  contractId?: string | null;
}
