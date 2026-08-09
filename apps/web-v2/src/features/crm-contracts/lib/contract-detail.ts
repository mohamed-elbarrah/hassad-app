import { ContractStatus, ContractType } from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";
import {
  contractDirectoryRecords,
  formatContractCurrency,
  formatContractStatus,
  type ContractDirectoryRecord,
} from "@/features/crm-contracts/lib/contract-directory";

export type ContractDetailMetric = {
  label: string;
  value: string;
  description: string;
  trend?: {
    label: string;
    tone: StatusTone;
  };
};

export type ContractPaymentRow = {
  id: string;
  label: string;
  due: string;
  amount: number;
  status: string;
  tone: StatusTone;
};

export type ContractStatusEntry = {
  id: string;
  date: string;
  title: string;
  actor: string;
  note: string;
  status: ContractStatus;
  completed?: boolean;
};

export type ContractContextRow = {
  label: string;
  value: string;
  helper: string;
};

export type ContractLinkedRecord = {
  label: string;
  value: string;
  href?: string;
  tone?: StatusTone;
};

export type ContractDetailRecord = {
  id: string;
  title: string;
  clientName: string;
  typeLabel: string;
  status: ContractStatus;
  statusTone: StatusTone;
  totalValue: number;
  monthlyValue: number | null;
  signedLabel: string;
  endLabel: string;
  renewalLabel: string;
  document: {
    fileName: string;
    version: string;
    generatedAt: string;
    signerState: string;
    openHref: string;
  };
  sidebarFacts: Array<{ label: string; value: string }>;
  metrics: ContractDetailMetric[];
  paymentPlan: ContractPaymentRow[];
  statusHistory: ContractStatusEntry[];
  billingContext: ContractContextRow[];
  linkedRecords: ContractLinkedRecord[];
};

function buildFallbackContractDetail(
  record: ContractDirectoryRecord,
): ContractDetailRecord {
  return {
    id: record.id,
    title: record.title,
    clientName: record.clientName,
    typeLabel: record.typeLabel,
    status: record.status,
    statusTone: record.statusTone,
    totalValue: record.totalValue,
    monthlyValue: record.monthlyValue,
    signedLabel: record.signedLabel,
    endLabel: record.endLabel,
    renewalLabel: record.renewalLabel,
    document: {
      fileName: `${record.title.toLowerCase().replaceAll(" ", "-")}.pdf`,
      version: "v1",
      generatedAt: record.signedLabel,
      signerState: record.eSigned ? "E-signed" : "Pending manual signature",
      openHref: "#",
    },
    sidebarFacts: [
      { label: "Client", value: record.clientName },
      { label: "Type", value: record.typeLabel },
      { label: "Signed", value: record.signedLabel },
      { label: "End date", value: record.endLabel },
      { label: "Renewal", value: record.renewalLabel },
      { label: "Invoices", value: record.invoiceLabel },
    ],
    metrics: [
      {
        label: "Total value",
        value: formatContractCurrency(record.totalValue),
        description: "Full contract value across the current term.",
      },
      {
        label: "Monthly value",
        value: record.monthlyValue ? formatContractCurrency(record.monthlyValue) : "—",
        description: "Monthly recurring value when the contract is a retainer.",
      },
      {
        label: "Project state",
        value: record.projectLabel,
        description: "Whether delivery has already been linked to a project.",
      },
      {
        label: "Invoice state",
        value: record.invoiceLabel,
        description: "Billing signal currently attached to this contract.",
        trend:
          record.invoiceTone === "destructive"
            ? { label: "Finance issue", tone: "destructive" }
            : record.invoiceTone === "warning" || record.invoiceTone === "attention"
              ? { label: "Needs review", tone: record.invoiceTone }
              : undefined,
      },
    ],
    paymentPlan: [
      {
        id: `${record.id}-pay-1`,
        label: "Down payment",
        due: record.signedLabel,
        amount: Math.round(record.totalValue * 0.4),
        status: record.invoiceLabel,
        tone: record.invoiceTone,
      },
      {
        id: `${record.id}-pay-2`,
        label: record.type === ContractType.MONTHLY_RETAINER ? "Monthly cycle" : "Final settlement",
        due: record.endLabel,
        amount: record.totalValue - Math.round(record.totalValue * 0.4),
        status: record.projectLabel,
        tone: record.projectTone,
      },
    ],
    statusHistory: [
      {
        id: `${record.id}-status-1`,
        date: record.signedLabel,
        title: "Contract status reached current state",
        actor: "Commercial team",
        note: `Contract is currently marked as ${formatContractStatus(record.status)}.`,
        status: record.status,
        completed: true,
      },
    ],
    billingContext: [
      {
        label: "Billing signal",
        value: record.invoiceLabel,
        helper: "Current invoice and payment state associated with the contract.",
      },
      {
        label: "Delivery link",
        value: record.projectLabel,
        helper: "Shows whether project delivery has already been activated.",
      },
      {
        label: "Renewal signal",
        value: record.renewalLabel,
        helper: "Primary renewal or expiry timing signal for this contract.",
      },
    ],
    linkedRecords: [
      { label: "Client", value: record.clientName },
      { label: "Project", value: record.projectLabel, tone: record.projectTone },
      { label: "Invoices", value: record.invoiceLabel, tone: record.invoiceTone },
    ],
  };
}

const contractDetailRecords: ContractDetailRecord[] = [
  {
    id: "contract-greenline-retainer",
    title: "Greenline growth retainer",
    clientName: "Greenline",
    typeLabel: "Monthly retainer",
    status: ContractStatus.ACTIVE,
    statusTone: "success",
    totalValue: 126000,
    monthlyValue: 14000,
    signedLabel: "Signed Jul 14",
    endLabel: "Ends Sep 7, 2026",
    renewalLabel: "30d renewal",
    document: {
      fileName: "greenline-growth-retainer-v1.pdf",
      version: "v1",
      generatedAt: "Jul 12, 2026",
      signerState: "E-signed Jul 14, 2026",
      openHref: "#",
    },
    sidebarFacts: [
      { label: "Client", value: "Greenline" },
      { label: "Type", value: "Monthly retainer" },
      { label: "Signed", value: "Jul 14, 2026" },
      { label: "Start date", value: "Jul 14, 2026" },
      { label: "End date", value: "Sep 7, 2026" },
      { label: "Renewal", value: "30d renewal" },
    ],
    metrics: [
      {
        label: "Total value",
        value: formatContractCurrency(126000),
        description: "Contract value across the signed retainer term.",
      },
      {
        label: "Monthly value",
        value: formatContractCurrency(14000),
        description: "Monthly recurring billing value.",
      },
      {
        label: "Payment progress",
        value: "2/3 paid",
        description: "Two scheduled billing cycles cleared, one still open.",
        trend: { label: "1 open invoice", tone: "warning" },
      },
      {
        label: "Renewal timing",
        value: "30 days",
        description: "Time left before renewal work should become active.",
        trend: { label: "Renewal watch", tone: "warning" },
      },
    ],
    paymentPlan: [
      {
        id: "greenline-pay-1",
        label: "July retainer",
        due: "Due Jul 14, 2026",
        amount: 14000,
        status: "Paid",
        tone: "success",
      },
      {
        id: "greenline-pay-2",
        label: "August retainer",
        due: "Due Aug 14, 2026",
        amount: 14000,
        status: "Issued",
        tone: "warning",
      },
      {
        id: "greenline-pay-3",
        label: "September closeout",
        due: "Due Sep 7, 2026",
        amount: 14000,
        status: "Planned",
        tone: "neutral",
      },
    ],
    statusHistory: [
      {
        id: "greenline-status-1",
        date: "Jul 11, 2026",
        title: "Contract drafted",
        actor: "Commercial ops",
        note: "Retainer package drafted from the approved proposal.",
        status: ContractStatus.DRAFT,
        completed: true,
      },
      {
        id: "greenline-status-2",
        date: "Jul 12, 2026",
        title: "Contract sent",
        actor: "Commercial ops",
        note: "Sent to the client for signature and retainer confirmation.",
        status: ContractStatus.SENT,
        completed: true,
      },
      {
        id: "greenline-status-3",
        date: "Jul 14, 2026",
        title: "Contract signed",
        actor: "Client signer",
        note: "E-signature completed and billing plan activated.",
        status: ContractStatus.SIGNED,
        completed: true,
      },
      {
        id: "greenline-status-4",
        date: "Jul 15, 2026",
        title: "Contract activated",
        actor: "Finance and PM",
        note: "Project delivery linked after the initial billing event was confirmed.",
        status: ContractStatus.ACTIVE,
        completed: true,
      },
    ],
    billingContext: [
      {
        label: "Billing signal",
        value: "1 open invoice",
        helper: "August billing is issued but still open.",
      },
      {
        label: "Delivery link",
        value: "Project linked",
        helper: "PM delivery already exists and is tied to the contract.",
      },
      {
        label: "Renewal work",
        value: "Start renewal discussion this month",
        helper: "Commercial follow-up should begin before the retainer end date.",
      },
    ],
    linkedRecords: [
      { label: "Proposal", value: "Greenline growth retainer" },
      { label: "Project", value: "Project linked", tone: "success" },
      { label: "Invoices", value: "2 open invoices", tone: "warning" },
    ],
  },
  {
    id: "contract-pulse-crm-rollout",
    title: "Pulse CRM rollout",
    clientName: "Pulse Health",
    typeLabel: "Fixed project",
    status: ContractStatus.ON_HOLD,
    statusTone: "attention",
    totalValue: 33000,
    monthlyValue: null,
    signedLabel: "Signed Jul 30",
    endLabel: "Ends Sep 12, 2026",
    renewalLabel: "No renewal",
    document: {
      fileName: "pulse-crm-rollout-v1.pdf",
      version: "v1",
      generatedAt: "Jul 28, 2026",
      signerState: "E-signed Jul 30, 2026",
      openHref: "#",
    },
    sidebarFacts: [
      { label: "Client", value: "Pulse Health" },
      { label: "Type", value: "Fixed project" },
      { label: "Signed", value: "Jul 30, 2026" },
      { label: "Start date", value: "Jul 30, 2026" },
      { label: "End date", value: "Sep 12, 2026" },
      { label: "Billing", value: "Payment issue" },
    ],
    metrics: [
      {
        label: "Total value",
        value: formatContractCurrency(33000),
        description: "Signed value for the CRM rollout project.",
      },
      {
        label: "Payment progress",
        value: "0/2 cleared",
        description: "Billing issue stopped activation before the first milestone cleared.",
        trend: { label: "Finance block", tone: "destructive" },
      },
      {
        label: "Project state",
        value: "Pending activation",
        description: "Delivery is not fully active while billing remains blocked.",
        trend: { label: "On hold", tone: "attention" },
      },
      {
        label: "Contract state",
        value: "On hold",
        description: "Operationally signed, but paused due to payment issues.",
      },
    ],
    paymentPlan: [
      {
        id: "pulse-pay-1",
        label: "Down payment",
        due: "Due Jul 30, 2026",
        amount: 13200,
        status: "Payment issue",
        tone: "destructive",
      },
      {
        id: "pulse-pay-2",
        label: "Final milestone",
        due: "Due Sep 12, 2026",
        amount: 19800,
        status: "Pending activation",
        tone: "attention",
      },
    ],
    statusHistory: [
      {
        id: "pulse-status-1",
        date: "Jul 27, 2026",
        title: "Contract drafted",
        actor: "Commercial ops",
        note: "Fixed-project contract prepared from the approved proposal.",
        status: ContractStatus.DRAFT,
        completed: true,
      },
      {
        id: "pulse-status-2",
        date: "Jul 28, 2026",
        title: "Contract sent",
        actor: "Commercial ops",
        note: "Sent to client for signature and payment confirmation.",
        status: ContractStatus.SENT,
        completed: true,
      },
      {
        id: "pulse-status-3",
        date: "Jul 30, 2026",
        title: "Contract signed",
        actor: "Client signer",
        note: "Client completed signing, but payment confirmation did not clear.",
        status: ContractStatus.SIGNED,
        completed: true,
      },
      {
        id: "pulse-status-4",
        date: "Aug 2, 2026",
        title: "Contract moved on hold",
        actor: "Finance",
        note: "Activation paused until the payment issue is resolved.",
        status: ContractStatus.ON_HOLD,
        completed: true,
      },
    ],
    billingContext: [
      {
        label: "Billing signal",
        value: "Down payment failed to clear",
        helper: "This is the reason the contract is operationally blocked.",
      },
      {
        label: "Delivery link",
        value: "Pending activation",
        helper: "PM handoff exists, but active execution should not start yet.",
      },
      {
        label: "Next step",
        value: "Resolve payment issue and activate delivery",
        helper: "Finance resolution is required before PM can proceed.",
      },
    ],
    linkedRecords: [
      { label: "Proposal", value: "Pulse CRM rollout" },
      { label: "Project", value: "Pending activation", tone: "attention" },
      { label: "Invoices", value: "Payment issue", tone: "destructive" },
    ],
  },
];

export function getContractDetailById(id: string) {
  const detail = contractDetailRecords.find((record) => record.id === id);
  if (detail) return detail;

  const directoryRecord = contractDirectoryRecords.find((record) => record.id === id);
  return directoryRecord ? buildFallbackContractDetail(directoryRecord) : null;
}
