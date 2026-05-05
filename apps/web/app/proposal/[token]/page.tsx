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
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

const STATUS_LABELS: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "مسودة",
  [ProposalStatus.SENT]: "بانتظار ردّك",
  [ProposalStatus.APPROVED]: "معتمد",
  [ProposalStatus.REVISION_REQUESTED]: "بحاجة تعديل",
  [ProposalStatus.REJECTED]: "مرفوض",
};

const STATUS_COLORS: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "bg-slate-100 text-slate-700",
  [ProposalStatus.SENT]: "bg-blue-100 text-blue-700",
  [ProposalStatus.APPROVED]: "bg-emerald-100 text-emerald-700",
  [ProposalStatus.REVISION_REQUESTED]: "bg-orange-100 text-orange-700",
  [ProposalStatus.REJECTED]: "bg-red-100 text-red-700",
};

// Build a full URL for the file path (from the API server)
function buildFileUrl(filePath: string): string {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace("/v1", "") ??
    "http://localhost:3001";
  return filePath.startsWith("http") ? filePath : `${apiBase}${filePath}`;
}

export default function ProposalSharePage({ params }: PageProps) {
  const { token } = use(params);
  const { data, isLoading, isError } = useGetProposalByTokenQuery(token);
  const [approveProposal, { isLoading: approving }] =
    useApproveProposalByTokenMutation();
  const [requestRevision, { isLoading: requesting }] =
    useRequestRevisionByTokenMutation();
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <p className="text-muted-foreground">جارٍ تحميل العرض...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <p className="text-destructive">
          العرض غير متوفر أو انتهت صلاحية الرابط.
        </p>
      </div>
    );
  }

  const canRespond = data.status === ProposalStatus.SENT;
  const statusLabel =
    STATUS_LABELS[data.status as ProposalStatus] ?? data.status;
  const statusColor =
    STATUS_COLORS[data.status as ProposalStatus] ??
    "bg-muted text-muted-foreground";

  const fileUrl = data.filePath ? buildFileUrl(data.filePath as string) : null;
  const companyLabel = data.request?.companyName ?? data.lead?.companyName;
  const contactLabel = data.request?.contactName ?? data.lead?.contactName;

  async function handleApprove() {
    try {
      await approveProposal({ token, body: { notes } }).unwrap();
      toast.success("تم اعتماد العرض الفني — شكراً لك");
    } catch {
      toast.error("تعذّر اعتماد العرض. حاول مجدداً.");
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
      toast.error("تعذّر إرسال طلب التعديل. حاول مجدداً.");
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl" dir="rtl">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl">{data.title}</CardTitle>
              {companyLabel && (
                <p className="text-sm text-muted-foreground mt-1">
                  {companyLabel}
                  {contactLabel ? ` — ${contactLabel}` : ""}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusColor}`}
            >
              {statusLabel}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── PDF Download ────────────────────────────────────────────── */}
          {fileUrl ? (
            <div className="flex items-center gap-3 rounded-xl border bg-slate-50 p-4">
              <FileText className="w-8 h-8 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">ملف العرض الفني</p>
                <p className="text-xs text-muted-foreground">
                  يمكنك تحميل الملف لمراجعة تفاصيل العرض
                </p>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Button variant="outline" size="sm" className="gap-2 shrink-0">
                  <Download className="w-4 h-4" />
                  تحميل العرض
                </Button>
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                لا يوجد ملف مرفق لهذا العرض.
              </p>
            </div>
          )}

          {/* ── Status-specific feedback ─────────────────────────────── */}
          {data.status === ProposalStatus.APPROVED && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">
                لقد اعتمدت هذا العرض الفني.
              </p>
            </div>
          )}

          {data.status === ProposalStatus.REVISION_REQUESTED && (
            <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
              <p className="text-sm text-orange-700 font-medium">
                طلبت تعديلاً على هذا العرض.
              </p>
            </div>
          )}

          {data.status === ProposalStatus.REJECTED && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                تم رفض هذا العرض.
              </p>
            </div>
          )}

          {/* ── Response area (only when SENT) ──────────────────────── */}
          {canRespond && (
            <>
              <div>
                <p className="text-sm font-medium mb-2">
                  ملاحظاتك (اختياري عند الموافقة — مطلوبة عند طلب التعديل)
                </p>
                <Textarea
                  rows={3}
                  placeholder="اكتب ملاحظاتك هنا..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={approving || requesting}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {approving ? "جارٍ الاعتماد..." : "موافقة على العرض"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRevision}
                  disabled={approving || requesting}
                  className="gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {requesting ? "جارٍ الإرسال..." : "طلب تعديل"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
