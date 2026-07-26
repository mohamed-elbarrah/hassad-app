"use client";


import { toast } from "sonner";
import { Pencil, FileText, Send, Link2, AlertCircle } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ProposalStatus } from "@hassad/shared";
import type { ProposalListItem } from "@/features/proposals/proposalsApi";
import { useSendProposalMutation } from "@/features/proposals/proposalsApi";
import { useGetProfileQuery } from "@/features/auth/authApi";
import { formatShortDate } from "@/lib/format";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { SalesStatusBadge } from "./shared/SalesStatusBadge";


const EDITABLE_STATUSES = new Set<ProposalStatus>([
  ProposalStatus.DRAFT,
  ProposalStatus.REVISION_REQUESTED,
  ProposalStatus.REJECTED,
]);

const SENDABLE_STATUSES = new Set<ProposalStatus>([
  ProposalStatus.DRAFT,
  ProposalStatus.REVISION_REQUESTED,
]);

function getProposalDisplayName(proposal: ProposalListItem) {
  if (proposal.request?.companyName) {
    return proposal.request.contactName
      ? `${proposal.request.companyName} — ${proposal.request.contactName}`
      : proposal.request.companyName;
  }
  if (proposal.lead?.companyName) {
    return proposal.lead.contactName
      ? `${proposal.lead.companyName} — ${proposal.lead.contactName}`
      : proposal.lead.companyName;
  }
  return proposal.leadId ?? proposal.requestId ?? "—";
}

/**
 * Cells-only renderer for the proposals queue.
 * The <tr> chrome is owned by `<DataTable>`; this only emits <td>s.
 */
export function renderProposalRowCells(
  proposal: ProposalListItem,
  helpers: {
    onActivate?: () => void;
    onEdit?: (p: ProposalListItem) => void;
    onCreateContract?: (id: string) => void;
  },
): React.ReactNode[] {
  const { onEdit, onCreateContract } = helpers;

  return [
    // Client name
    <td key="client" className="px-5 py-3.5 align-middle">
      <span className="text-sm font-medium text-natural-100">
        {getProposalDisplayName(proposal)}
      </span>
    </td>,

    // Price
    <td key="price" className="px-5 py-3.5 align-middle">
      <CurrencyDisplay
        amount={proposal.totalPrice}
        size="sm"
        className="text-sm font-semibold text-natural-100 tabular-nums"
      />
    </td>,

    // Created date
    <td key="createdAt" className="px-5 py-3.5 align-middle">
      <span className="text-sm text-portal-note-text">
        {formatShortDate(proposal.createdAt)}
      </span>
    </td>,

    // Status
    <td key="status" className="px-5 py-3.5 align-middle">
      <SalesStatusBadge domain="proposal" status={proposal.status} />
    </td>,

    // Actions
    <td key="actions" className="px-5 py-3.5 align-middle text-start">
      <ProposalActionsCell
        proposal={proposal}
        onEdit={onEdit}
        onCreateContract={onCreateContract}
      />
    </td>,
  ];
}

// ── Actions cell (keeps mutation logic colocated) ────────────────────────────

function ProposalActionsCell({
  proposal,
  onEdit,
  onCreateContract,
}: {
  proposal: ProposalListItem;
  onEdit?: (p: ProposalListItem) => void;
  onCreateContract?: (id: string) => void;
}) {
  const [sendProposal, { isLoading: sending }] = useSendProposalMutation();
  const { data: currentUser } = useGetProfileQuery();

  function canEdit(p: ProposalListItem): boolean {
    if (!currentUser) return false;
    if (currentUser.role === "ADMIN") return true;
    if (!EDITABLE_STATUSES.has(p.status)) return false;
    return p.createdBy === currentUser.id;
  }

  async function handleSend(id: string) {
    try {
      const result = await sendProposal(id).unwrap();
      toast.success("تم إرسال العرض بنجاح");
      const shareUrl = `${window.location.origin}/proposal/${result.shareLinkToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("تم نسخ رابط العرض");
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل إرسال العرض";
      toast.error(message);
    }
  }

  async function handleCopy(token?: string | null) {
    if (!token) return;
    const shareUrl = `${window.location.origin}/proposal/${token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("تم نسخ رابط العرض");
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  }

  return (
    <div className="flex justify-end gap-2 items-center">
      {canEdit(proposal) && onEdit && (
        <ActionButton
          size="sm"
          variant="ghost"
          title="تعديل العرض"
          onClick={() => onEdit(proposal)}
        >
          <Pencil className="w-4 h-4" />
        </ActionButton>
      )}

      {proposal.status === ProposalStatus.APPROVED && onCreateContract && (
        <ActionButton
          size="sm"
          variant="primary"
          onClick={() => onCreateContract(proposal.id)}
        >
          <FileText className="w-4 h-4 ml-1" />
          إنشاء عقد
        </ActionButton>
      )}

      {SENDABLE_STATUSES.has(proposal.status) && (
        <ActionButton
          size="sm"
          variant="action-blue"
          onClick={() => handleSend(proposal.id)}
          loading={sending}
          title="إرسال العرض للعميل"
        >
          <Send className="w-4 h-4 ml-1" />
          إرسال
        </ActionButton>
      )}

      {proposal.status === ProposalStatus.SENT && (
        <ActionButton
          size="sm"
          variant="outline"
          onClick={() => handleCopy(proposal.shareLinkToken)}
          disabled={!proposal.shareLinkToken}
          title="نسخ رابط العرض"
        >
          <Link2 className="w-4 h-4 ml-1" />
          نسخ الرابط
        </ActionButton>
      )}

      {proposal.status === ProposalStatus.REJECTED && onEdit && (
        <ActionButton
          size="sm"
          variant="outline"
          onClick={() => onEdit(proposal)}
          title="تعديل وإعادة إرسال"
        >
          <AlertCircle className="w-4 h-4 ml-1" />
          تعديل وإعادة إرسال
        </ActionButton>
      )}
    </div>
  );
}
