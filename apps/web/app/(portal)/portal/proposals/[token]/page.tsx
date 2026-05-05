"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import {
  useGetProposalByTokenQuery,
  useApproveProposalByTokenMutation,
  useRequestRevisionByTokenMutation,
} from "@/features/proposals/proposalsApi";
import { ProposalStatus } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ token: string }>;
}

function buildFileUrl(filePath: string): string {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace("/v1", "") ??
    "http://localhost:3001";
  return filePath.startsWith("http") ? filePath : `${apiBase}${filePath}`;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "بانتظار ردّك",
  APPROVED: "معتمد",
  REVISION_REQUESTED: "بحاجة تعديل",
  REJECTED: "مرفوض",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  SENT: "default",
  APPROVED: "secondary",
  REVISION_REQUESTED: "destructive",
  REJECTED: "destructive",
};

export default function PortalProposalDetailPage({ params }: PageProps) {
  const { token } = use(params);
  const { data, isLoading, isError } = useGetProposalByTokenQuery(token);
  const [approveProposal, { isLoading: approving }] =
    useApproveProposalByTokenMutation();
  const [requestRevision, { isLoading: requesting }] =
    useRequestRevisionByTokenMutation();
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/portal/proposals">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العروض الفنية
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6 text-center text-destructive text-sm">
            العرض غير متوفر أو انتهت صلاحية الرابط.
          </CardContent>
        </Card>
      </div>
    );
  }

  const canRespond = data.status === ProposalStatus.SENT;
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
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/portal/proposals">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            العروض الفنية
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium truncate max-w-xs">
          {data.title}
        </span>
      </div>

      <Card>
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
            <Badge variant={STATUS_VARIANT[data.status] ?? "outline"}>
              {STATUS_LABELS[data.status] ?? data.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* PDF Download */}
          {fileUrl ? (
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <FileText className="w-8 h-8 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">ملف العرض الفني</p>
                <p className="text-xs text-muted-foreground">
                  راجع تفاصيل العرض قبل الرد
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

          {/* Status-specific banners */}
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
                طلبت تعديلاً على هذا العرض. سيتواصل معك فريقنا قريباً.
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

          {/* Response area — only when status is SENT */}
          {canRespond && (
            <div className="space-y-4 rounded-xl border p-4">
              <p className="text-sm font-semibold">ردّك على العرض</p>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  ملاحظاتك (اختيارية عند الموافقة — مطلوبة عند طلب التعديل)
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
