"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, FileText, Send, Link2, AlertCircle } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { TableRow, TableCell } from "@/components/ui/table";
import { Pill } from "@/components/design-system/Pill";
import { ProposalStatus } from "@hassad/shared";
import type { ProposalListItem } from "@/features/proposals/proposalsApi";
import { useSendProposalMutation } from "@/features/proposals/proposalsApi";
import { useGetProfileQuery } from "@/features/auth/authApi";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { ProposalFormDialog } from "./ProposalFormDialog";

const STATUS_META: Record<
  ProposalStatus,
  { label: string; tone: import("@/components/design-system/Pill").PillTone }
> = {
  [ProposalStatus.DRAFT]: { label: "مسودة", tone: "neutral" },
  [ProposalStatus.SENT]: { label: "مرسل", tone: "blue" },
  [ProposalStatus.APPROVED]: { label: "معتمد", tone: "success" },
  [ProposalStatus.REVISION_REQUESTED]: { label: "بحاجة تعديل", tone: "warning" },
  [ProposalStatus.REJECTED]: { label: "مرفوض", tone: "danger" },
};

const EDITABLE_STATUSES = new Set<ProposalStatus>([
  ProposalStatus.DRAFT,
  ProposalStatus.REVISION_REQUESTED,
  ProposalStatus.REJECTED,
]);

const SENDABLE_STATUSES = new Set<ProposalStatus>([
  ProposalStatus.DRAFT,
  ProposalStatus.REVISION_REQUESTED,
]);

const PROPOSAL_COLUMNS: DataTableColumn[] = [
  { id: "client", label: "العميل / العميل المحتمل", align: "right" },
  { id: "price", label: "السعر", align: "right" },
  { id: "createdAt", label: "تاريخ الإنشاء", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "actions", label: "إجراءات", align: "left" },
];

const PROPOSAL_EMPTY: DataTableEmptyState = {
  icon: FileText,
  message: "لا توجد عروض بعد.",
  hint: "أنشئ عرضاً فنياً جديداً من صفحة لوحة المبيعات.",
};

interface ProposalsTableProps {
  proposals: ProposalListItem[];
  onCreateContract?: (proposalId: string) => void;
}

export function ProposalsTable({
  proposals,
  onCreateContract,
}: ProposalsTableProps) {
  const [sendProposal, { isLoading: sending }] = useSendProposalMutation();
  const { data: currentUser } = useGetProfileQuery();
  const [editProposal, setEditProposal] = useState<ProposalListItem | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);

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

  function canEdit(proposal: ProposalListItem): boolean {
    if (!currentUser) return false;
    if (currentUser.role === "ADMIN") return true;
    // Only editable statuses
    if (!EDITABLE_STATUSES.has(proposal.status)) return false;
    return proposal.createdBy === currentUser.id;
  }

  function handleEditClick(proposal: ProposalListItem) {
    setEditProposal(proposal);
    setEditOpen(true);
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
    <>
      <DataTable
        columns={PROPOSAL_COLUMNS}
        data={proposals}
        isLoading={false}
        isError={false}
        emptyState={PROPOSAL_EMPTY}
        renderRow={(proposal) => (
          <TableRow key={proposal.id}>
            <TableCell className="text-right">
              {getProposalDisplayName(proposal)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(proposal.totalPrice)}
            </TableCell>
            <TableCell className="text-right">
              {formatShortDate(proposal.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <Pill tone={STATUS_META[proposal.status].tone} className="text-xs h-6 px-2">
                {STATUS_META[proposal.status].label}
              </Pill>
            </TableCell>
            <TableCell className="text-left">
              <div className="flex justify-end gap-2 items-center">
                {/* Edit button — only for proposals in editable statuses */}
                {canEdit(proposal) && (
                  <ActionButton
                    size="sm"
                    variant="ghost"
                    title="تعديل العرض"
                    onClick={() => handleEditClick(proposal)}
                  >
                    <Pencil className="w-4 h-4" />
                  </ActionButton>
                )}

                {/* Primary CTA based on status */}
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

                {proposal.status === ProposalStatus.REJECTED && (
                  <ActionButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(proposal)}
                    title="تعديل وإعادة إرسال"
                  >
                    <AlertCircle className="w-4 h-4 ml-1" />
                    تعديل وإعادة إرسال
                  </ActionButton>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {editProposal && (
        <ProposalFormDialog
          mode="edit"
          proposal={editProposal}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
