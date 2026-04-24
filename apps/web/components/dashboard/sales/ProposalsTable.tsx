"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProposalStatus } from "@hassad/shared";
import type { ProposalListItem } from "@/features/proposals/proposalsApi";
import { useSendProposalMutation } from "@/features/proposals/proposalsApi";

const STATUS_LABELS: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "مسودة",
  [ProposalStatus.SENT]: "مرسل",
  [ProposalStatus.APPROVED]: "معتمد",
  [ProposalStatus.REVISION_REQUESTED]: "بحاجة تعديل",
  [ProposalStatus.REJECTED]: "مرفوض",
};

interface ProposalsTableProps {
  proposals: ProposalListItem[];
}

export function ProposalsTable({ proposals }: ProposalsTableProps) {
  const [sendProposal, { isLoading }] = useSendProposalMutation();

  async function handleSend(id: string) {
    try {
      const result = await sendProposal(id).unwrap();
      toast.success("تم إرسال العرض بنجاح");
      const shareUrl = `${window.location.origin}/proposal/${result.shareToken}`;
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العميل</TableHead>
            <TableHead>السعر</TableHead>
            <TableHead>تاريخ البداية</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="text-right">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                لا توجد عروض بعد.
              </TableCell>
            </TableRow>
          ) : (
            proposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell>
                  {proposal.client?.name ?? proposal.clientId}
                </TableCell>
                <TableCell>{proposal.price.toLocaleString("en-US")}</TableCell>
                <TableCell>
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    numberingSystem: "latn",
                  }).format(new Date(proposal.startDate))}
                </TableCell>
                <TableCell>{STATUS_LABELS[proposal.status]}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {proposal.status === ProposalStatus.DRAFT ||
                    proposal.status === ProposalStatus.REVISION_REQUESTED ? (
                      <Button
                        size="sm"
                        onClick={() => handleSend(proposal.id)}
                        disabled={isLoading}
                      >
                        إرسال
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(proposal.shareToken)}
                        disabled={!proposal.shareToken}
                      >
                        نسخ الرابط
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
