"use client";

import { useState, use } from "react";
import {
  useApproveProposalByTokenMutation,
  useGetProposalByTokenQuery,
  useRequestRevisionByTokenMutation,
} from "@/features/proposals/proposalsApi";
import { ProposalStatus } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ token: string }>;
}

const STATUS_LABELS: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "مسودة",
  [ProposalStatus.SENT]: "مرسل",
  [ProposalStatus.APPROVED]: "معتمد",
  [ProposalStatus.REVISION_REQUESTED]: "بحاجة تعديل",
  [ProposalStatus.REJECTED]: "مرفوض",
};

export default function ProposalSharePage({ params }: PageProps) {
  const { token } = use(params);
  const { data, isLoading, isError } = useGetProposalByTokenQuery(token);
  const [approveProposal, { isLoading: approving }] =
    useApproveProposalByTokenMutation();
  const [requestRevision, { isLoading: requesting }] =
    useRequestRevisionByTokenMutation();
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return <div className="p-8">جارٍ تحميل العرض...</div>;
  }

  if (isError || !data) {
    return <div className="p-8 text-destructive">العرض غير متوفر.</div>;
  }

  const canRespond =
    data.status === ProposalStatus.SENT ||
    data.status === ProposalStatus.REVISION_REQUESTED;

  async function handleApprove() {
    try {
      await approveProposal({ token, body: { notes } }).unwrap();
      toast.success("تم اعتماد العرض");
    } catch {
      toast.error("تعذر اعتماد العرض. حاول مجدداً.");
    }
  }

  async function handleRevision() {
    try {
      await requestRevision({ token, body: { notes } }).unwrap();
      toast.success("تم إرسال طلب التعديل");
    } catch {
      toast.error("تعذر إرسال طلب التعديل. حاول مجدداً.");
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl" dir="rtl">
        <CardHeader>
          <CardTitle>عرض فني — {data.lead?.companyName ?? "العميل"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            الحالة الحالية: {STATUS_LABELS[data.status as ProposalStatus]}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">الخدمات</p>
            <ul className="list-disc ps-5 text-sm">
              {(data.servicesList as string[]).map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">السعر</p>
              <p className="font-medium">
                {data.totalPrice.toLocaleString("en-US")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">تاريخ الإنشاء</p>
              <p className="font-medium">
                {new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  numberingSystem: "latn",
                }).format(new Date(data.createdAt as string))}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">ملاحظاتك</p>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canRespond}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleApprove} disabled={!canRespond || approving}>
              موافقة
            </Button>
            <Button
              variant="outline"
              onClick={handleRevision}
              disabled={!canRespond || requesting}
            >
              طلب تعديل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
