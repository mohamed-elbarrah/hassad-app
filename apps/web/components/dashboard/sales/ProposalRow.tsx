"use client";


import { toast } from "sonner";
import {
  AlertCircle,
  FileText,
  Link2,
  Loader2,
  Pencil,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProposalStatus } from "@hassad/shared";
import type { ProposalListItem } from "@/features/proposals/proposalsApi";
import { useSendProposalMutation } from "@/features/proposals/proposalsApi";
import { useGetProfileQuery } from "@/features/auth/authApi";
import { formatCurrency, formatShortDate } from "@/lib/format";
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
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {formatCurrency(proposal.totalPrice)}
      </span>
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
        <Button
          size="icon"
          variant="ghost"
          title="تعديل العرض"
          onClick={() => onEdit(proposal)}
          className="size-8 rounded-lg"
        >
          <Pencil className="size-4" />
        </Button>
      )}

      {proposal.status === ProposalStatus.APPROVED && onCreateContract && (
        <Button
          size="sm"
          onClick={() => onCreateContract(proposal.id)}
          className="rounded-lg"
        >
          <FileText className="ml-1 size-4" />
          إنشاء عقد
        </Button>
      )}

      {SENDABLE_STATUSES.has(proposal.status) && (
        <Button
          size="sm"
          onClick={() => handleSend(proposal.id)}
          disabled={sending}
          title="إرسال العرض للعميل"
          className="rounded-lg"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="ml-1 size-4" />}
          إرسال
        </Button>
      )}

      {proposal.status === ProposalStatus.SENT && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleCopy(proposal.shareLinkToken)}
          disabled={!proposal.shareLinkToken}
          title="نسخ رابط العرض"
          className="rounded-lg"
        >
          <Link2 className="ml-1 size-4" />
          نسخ الرابط
        </Button>
      )}

      {proposal.status === ProposalStatus.REJECTED && onEdit && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(proposal)}
          title="تعديل وإعادة إرسال"
          className="rounded-lg"
        >
          <AlertCircle className="ml-1 size-4" />
          تعديل وإعادة إرسال
        </Button>
      )}
    </div>
  );
}
