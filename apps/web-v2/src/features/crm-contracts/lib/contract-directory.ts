import { ContractStatus, ContractType } from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";

export type ContractDirectoryFilter =
  | "all"
  | "sent"
  | "signed"
  | "active"
  | "on-hold"
  | "expired"
  | "cancelled";
export type ContractDateFilter =
  | "all-dates"
  | "ending-30-days"
  | "ending-60-days"
  | "ending-90-days";
export type ContractValueFilter =
  | "all-values"
  | "under-15000"
  | "15000-30000"
  | "30000-50000"
  | "50000-plus";

export type ContractDirectoryRecord = {
  id: string;
  title: string;
  clientName: string;
  type: ContractType;
  typeLabel: string;
  status: ContractStatus;
  statusTone: StatusTone;
  totalValue: number;
  monthlyValue: number | null;
  signedLabel: string;
  endLabel: string;
  renewalLabel: string;
  renewalTone: StatusTone;
  projectLabel: string;
  projectTone: StatusTone;
  invoiceLabel: string;
  invoiceTone: StatusTone;
  endingInDays: number | null;
  eSigned: boolean;
};

const contractTypeLabels: Record<ContractType, string> = {
  [ContractType.MONTHLY_RETAINER]: "Monthly retainer",
  [ContractType.FIXED_PROJECT]: "Fixed project",
  [ContractType.ONE_TIME_SERVICE]: "One-time service",
};

const contractStatusLabels: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: "Draft",
  [ContractStatus.SENT]: "Sent",
  [ContractStatus.SIGNED]: "Signed",
  [ContractStatus.ACTIVE]: "Active",
  [ContractStatus.ON_HOLD]: "On hold",
  [ContractStatus.COMPLETED]: "Completed",
  [ContractStatus.EXPIRED]: "Expired",
  [ContractStatus.CANCELLED]: "Cancelled",
};

export const contractDirectoryRecords: ContractDirectoryRecord[] = [
  {
    id: "contract-enterprise-rebrand",
    title: "Enterprise Foods rebrand",
    clientName: "Enterprise Foods",
    type: ContractType.FIXED_PROJECT,
    typeLabel: contractTypeLabels[ContractType.FIXED_PROJECT],
    status: ContractStatus.ACTIVE,
    statusTone: "success",
    totalValue: 54000,
    monthlyValue: null,
    signedLabel: "Signed Aug 6",
    endLabel: "Ends Sep 18, 2026",
    renewalLabel: "No renewal",
    renewalTone: "neutral",
    projectLabel: "Project linked",
    projectTone: "success",
    invoiceLabel: "1 open invoice",
    invoiceTone: "warning",
    endingInDays: 41,
    eSigned: true,
  },
  {
    id: "contract-greenline-retainer",
    title: "Greenline growth retainer",
    clientName: "Greenline",
    type: ContractType.MONTHLY_RETAINER,
    typeLabel: contractTypeLabels[ContractType.MONTHLY_RETAINER],
    status: ContractStatus.ACTIVE,
    statusTone: "success",
    totalValue: 126000,
    monthlyValue: 14000,
    signedLabel: "Signed Jul 14",
    endLabel: "Ends Sep 7, 2026",
    renewalLabel: "30d renewal",
    renewalTone: "warning",
    projectLabel: "Project linked",
    projectTone: "success",
    invoiceLabel: "2 open invoices",
    invoiceTone: "warning",
    endingInDays: 30,
    eSigned: true,
  },
  {
    id: "contract-al-noor-launch",
    title: "Al Noor launch contract",
    clientName: "Al Noor",
    type: ContractType.FIXED_PROJECT,
    typeLabel: contractTypeLabels[ContractType.FIXED_PROJECT],
    status: ContractStatus.SENT,
    statusTone: "warning",
    totalValue: 28000,
    monthlyValue: null,
    signedLabel: "Sent Aug 7",
    endLabel: "Ends Oct 1, 2026",
    renewalLabel: "No renewal",
    renewalTone: "neutral",
    projectLabel: "No project",
    projectTone: "neutral",
    invoiceLabel: "No invoices",
    invoiceTone: "neutral",
    endingInDays: 54,
    eSigned: false,
  },
  {
    id: "contract-riyadh-clinics-growth",
    title: "Riyadh Clinics lead gen",
    clientName: "Riyadh Clinics",
    type: ContractType.ONE_TIME_SERVICE,
    typeLabel: contractTypeLabels[ContractType.ONE_TIME_SERVICE],
    status: ContractStatus.SIGNED,
    statusTone: "active",
    totalValue: 18000,
    monthlyValue: null,
    signedLabel: "Signed Aug 5",
    endLabel: "Ends Sep 2, 2026",
    renewalLabel: "No renewal",
    renewalTone: "neutral",
    projectLabel: "Pending activation",
    projectTone: "attention",
    invoiceLabel: "Down payment pending",
    invoiceTone: "attention",
    endingInDays: 25,
    eSigned: true,
  },
  {
    id: "contract-pulse-crm-rollout",
    title: "Pulse CRM rollout",
    clientName: "Pulse Health",
    type: ContractType.FIXED_PROJECT,
    typeLabel: contractTypeLabels[ContractType.FIXED_PROJECT],
    status: ContractStatus.ON_HOLD,
    statusTone: "attention",
    totalValue: 33000,
    monthlyValue: null,
    signedLabel: "Signed Jul 30",
    endLabel: "Ends Sep 12, 2026",
    renewalLabel: "No renewal",
    renewalTone: "neutral",
    projectLabel: "Pending activation",
    projectTone: "attention",
    invoiceLabel: "Payment issue",
    invoiceTone: "destructive",
    endingInDays: 35,
    eSigned: true,
  },
  {
    id: "contract-oasis-retail-old",
    title: "Oasis Retail activation",
    clientName: "Oasis Retail",
    type: ContractType.ONE_TIME_SERVICE,
    typeLabel: contractTypeLabels[ContractType.ONE_TIME_SERVICE],
    status: ContractStatus.EXPIRED,
    statusTone: "destructive",
    totalValue: 12000,
    monthlyValue: null,
    signedLabel: "Signed May 2",
    endLabel: "Ended Aug 2, 2026",
    renewalLabel: "Expired Aug 2",
    renewalTone: "destructive",
    projectLabel: "Completed project",
    projectTone: "neutral",
    invoiceLabel: "Closed",
    invoiceTone: "success",
    endingInDays: -6,
    eSigned: true,
  },
  {
    id: "contract-northstar-support",
    title: "Northstar support extension",
    clientName: "Northstar",
    type: ContractType.MONTHLY_RETAINER,
    typeLabel: contractTypeLabels[ContractType.MONTHLY_RETAINER],
    status: ContractStatus.CANCELLED,
    statusTone: "destructive",
    totalValue: 24000,
    monthlyValue: 8000,
    signedLabel: "Signed Jun 10",
    endLabel: "Cancelled Jul 29, 2026",
    renewalLabel: "Cancelled",
    renewalTone: "destructive",
    projectLabel: "No project",
    projectTone: "neutral",
    invoiceLabel: "Closed",
    invoiceTone: "neutral",
    endingInDays: null,
    eSigned: false,
  },
];

export function formatContractCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatContractStatus(status: ContractStatus) {
  return contractStatusLabels[status];
}

export function getFilteredContracts(
  statusFilter: ContractDirectoryFilter,
  dateFilter: ContractDateFilter,
  valueFilter: ContractValueFilter
) {
  return contractDirectoryRecords
    .filter((row) => {
      if (statusFilter === "sent") return row.status === ContractStatus.SENT;
      if (statusFilter === "signed") return row.status === ContractStatus.SIGNED;
      if (statusFilter === "active") return row.status === ContractStatus.ACTIVE;
      if (statusFilter === "on-hold") return row.status === ContractStatus.ON_HOLD;
      if (statusFilter === "expired") return row.status === ContractStatus.EXPIRED;
      if (statusFilter === "cancelled") return row.status === ContractStatus.CANCELLED;
      return true;
    })
    .filter((row) => {
      if (dateFilter === "ending-30-days") {
        return row.endingInDays !== null && row.endingInDays >= 0 && row.endingInDays <= 30;
      }
      if (dateFilter === "ending-60-days") {
        return row.endingInDays !== null && row.endingInDays >= 0 && row.endingInDays <= 60;
      }
      if (dateFilter === "ending-90-days") {
        return row.endingInDays !== null && row.endingInDays >= 0 && row.endingInDays <= 90;
      }
      return true;
    })
    .filter((row) => {
      if (valueFilter === "under-15000") return row.totalValue < 15000;
      if (valueFilter === "15000-30000") {
        return row.totalValue >= 15000 && row.totalValue < 30000;
      }
      if (valueFilter === "30000-50000") {
        return row.totalValue >= 30000 && row.totalValue < 50000;
      }
      if (valueFilter === "50000-plus") return row.totalValue >= 50000;
      return true;
    })
    .toSorted((left, right) => right.totalValue - left.totalValue);
}
