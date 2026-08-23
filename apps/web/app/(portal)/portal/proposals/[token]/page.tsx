"use client";

import { useState, use } from "react";
import { toast } from "sonner";
import {
  useApprovePortalProposalMutation,
  useGetPortalProposalByTokenQuery,
  useRequestPortalProposalRevisionMutation,
} from "@/features/portal/portalApi";
import { ProposalClientResponseArea, ProposalDetailLoading, ProposalDetailView } from "@/components/proposal-detail/ProposalDetailPattern";
import { buildPortalFileUrl } from "@/lib/portal-files";
import { DetailErrorState } from "@/components/portal/shared/DetailErrorState";

export default function PortalProposalDetailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { data: proposal, isLoading, isError } = useGetPortalProposalByTokenQuery(token);
  const [approveProposal, { isLoading: approving }] = useApprovePortalProposalMutation();
  const [requestRevision, { isLoading: requesting }] = useRequestPortalProposalRevisionMutation();
  const [notes, setNotes] = useState("");
  const [responseStatus, setResponseStatus] = useState<string | null>(null);

  if (isLoading) return <ProposalDetailLoading />;

  if (isError || !proposal) {
    return (
      <DetailErrorState
        title="تعذر تحميل العرض"
        backHref="/portal/proposals"
        backLabel="العروض الفنية"
      />
    );
  }

  async function handleApprove() {
    try {
      await approveProposal({ token, body: { notes } }).unwrap();
      setResponseStatus("APPROVED");
      setNotes("");
      toast.success("تم اعتماد العرض الفني");
    } catch {
      toast.error("تعذّر اعتماد العرض");
    }
  }

  async function handleRevision() {
    if (!notes.trim()) {
      toast.error("يرجى كتابة ملاحظاتك قبل طلب التعديل");
      return;
    }
    try {
      await requestRevision({ token, body: { notes } }).unwrap();
      setResponseStatus("REVISION_REQUESTED");
      toast.success("تم إرسال طلب التعديل");
    } catch {
      toast.error("تعذّر إرسال طلب التعديل");
    }
  }

  return (
    <ProposalDetailView
      proposal={proposal}
      backHref="/portal/proposals"
      backLabel="العودة إلى العروض"
      fileUrl={proposal.fileUrl ?? (proposal.filePath ? buildPortalFileUrl(proposal.filePath) : null)}
      audience="client"
      responseArea={
        <ProposalClientResponseArea
          status={responseStatus ?? proposal.status}
          notes={notes}
          onNotesChange={setNotes}
          onApprove={handleApprove}
          onRevision={handleRevision}
          approving={approving}
          requesting={requesting}
        />
      }
    />
  );
}
