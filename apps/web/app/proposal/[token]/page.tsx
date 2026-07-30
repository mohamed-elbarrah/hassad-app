"use client";

import { useState, use } from "react";
import { toast } from "sonner";
import {
  useApproveProposalByTokenMutation,
  useGetProposalByTokenQuery,
  useRequestRevisionByTokenMutation,
} from "@/features/proposals/proposalsApi";
import { ProposalClientResponseArea, ProposalDetailLoading, ProposalDetailView } from "@/components/proposal-detail/ProposalDetailPattern";
import { buildPortalFileUrl } from "@/lib/portal-files";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Sparkles } from "lucide-react";

export default function ProposalSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { data: proposal, isLoading, isError } = useGetProposalByTokenQuery(token);
  const [approveProposal, { isLoading: approving }] = useApproveProposalByTokenMutation();
  const [requestRevision, { isLoading: requesting }] = useRequestRevisionByTokenMutation();
  const [notes, setNotes] = useState("");

  if (isLoading) return <ProposalDetailLoading />;

  if (isError || !proposal) {
    return (
      <div dir="rtl" className="p-6">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>العرض غير متوفر</EmptyTitle>
                <EmptyDescription>الرابط غير صالح أو انتهت صلاحيته.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleApprove() {
    try {
      await approveProposal({ token, body: { notes } }).unwrap();
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
      toast.success("تم إرسال طلب التعديل");
    } catch {
      toast.error("تعذّر إرسال طلب التعديل");
    }
  }

  return (
    <ProposalDetailView
      proposal={proposal}
      backHref="/"
      backLabel="العودة"
      fileUrl={proposal.filePath ? buildPortalFileUrl(proposal.filePath) : null}
      audience="client"
      responseArea={
        <ProposalClientResponseArea
          status={proposal.status}
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
