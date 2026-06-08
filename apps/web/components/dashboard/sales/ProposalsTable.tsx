"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, FileText } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { TableRow, TableCell } from "@/components/ui/table";
import { ProposalStatus } from "@hassad/shared";
import type { ProposalListItem } from "@/features/proposals/proposalsApi";
import { useSendProposalMutation } from "@/features/proposals/proposalsApi";
import { useGetProfileQuery } from "@/features/auth/authApi";
import { ProposalFormDialog } from "./ProposalFormDialog";

const STATUS_LABELS: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "مسودة",
  [ProposalStatus.SENT]: "مرسل",
  [ProposalStatus.APPROVED]: "معتمد",
  [ProposalStatus.REVISION_REQUESTED]: "بحاجة تعديل",
  [ProposalStatus.REJECTED]: "مرفوض",
};

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
    if ((currentUser as any).role?.name === "ADMIN") return true;
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
              {proposal.totalPrice.toLocaleString("en-US")}
            </TableCell>
            <TableCell className="text-right">
              {new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                numberingSystem: "latn",
              }).format(new Date(proposal.createdAt))}
            </TableCell>
            <TableCell className="text-right">
              {STATUS_LABELS[proposal.status]}
            </TableCell>
            <TableCell className="text-left">
              <div className="flex justify-end gap-2">
                {canEdit(proposal) && (
                  <ActionButton
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditClick(proposal)}
                  >
                    <Pencil className="w-4 h-4" />
                  </ActionButton>
                )}
                {proposal.status === ProposalStatus.APPROVED &&
                onCreateContract ? (
                  <ActionButton
                    size="sm"
                    variant="primary"
                    onClick={() => onCreateContract(proposal.id)}
                  >
                    <FileText className="w-4 h-4 ml-1" />
                    إنشاء عقد
                  </ActionButton>
                ) : proposal.status === ProposalStatus.DRAFT ||
                  proposal.status === ProposalStatus.REVISION_REQUESTED ? (
                  <ActionButton
                    size="sm"
                    variant="primary"
                    onClick={() => handleSend(proposal.id)}
                    loading={sending}
                  >
                    إرسال
                  </ActionButton>
                ) : (
                  <ActionButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(proposal.shareLinkToken)}
                    disabled={!proposal.shareLinkToken}
                  >
                    نسخ الرابط
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
