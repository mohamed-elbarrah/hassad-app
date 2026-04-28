"use client";

import { useState, use } from "react";
import {
  useGetContractByTokenQuery,
  useSignContractByTokenMutation,
} from "@/features/contracts/contractsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  PenLine,
} from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

// Build a full URL for a file path served from the API
function buildFileUrl(filePath: string): string {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace("/v1", "") ??
    "http://localhost:3001";
  return filePath.startsWith("http") ? filePath : `${apiBase}${filePath}`;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "بانتظار توقيعك",
  SIGNED: "موقَّع",
  ACTIVE: "ساري",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  SIGNED: "bg-emerald-100 text-emerald-700",
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function ContractSharePage({ params }: PageProps) {
  const { token } = use(params);
  const { data, isLoading, isError } = useGetContractByTokenQuery(token);
  const [signContract, { isLoading: signing }] =
    useSignContractByTokenMutation();

  const [signedByName, setSignedByName] = useState("");
  const [signedByEmail, setSignedByEmail] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <p className="text-muted-foreground">جارٍ تحميل العقد...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <p className="text-destructive">
          العقد غير متوفر أو انتهت صلاحية الرابط.
        </p>
      </div>
    );
  }

  const canSign = data.status === "SENT";
  const statusLabel = STATUS_LABELS[data.status] ?? data.status;
  const statusColor =
    STATUS_COLORS[data.status] ?? "bg-muted text-muted-foreground";
  const fileUrl = data.filePath ? buildFileUrl(data.filePath) : null;

  async function handleSign() {
    if (!signedByName.trim()) {
      toast.error("يرجى كتابة اسمك الكامل قبل التوقيع");
      return;
    }
    try {
      await signContract({
        token,
        body: {
          signedByName: signedByName.trim(),
          signedByEmail: signedByEmail.trim() || undefined,
        },
      }).unwrap();
      toast.success("تم توقيع العقد بنجاح — شكراً لك");
    } catch {
      toast.error("تعذّر توقيع العقد. حاول مجدداً.");
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl" dir="rtl">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl">{data.title}</CardTitle>
              {data.client?.companyName && (
                <p className="text-sm text-muted-foreground mt-1">
                  {data.client.companyName}
                  {data.client.contactName
                    ? ` — ${data.client.contactName}`
                    : ""}
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
          {/* ── Contract details ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">
                القيمة الإجمالية
              </p>
              <p className="font-semibold">
                {data.totalValue.toLocaleString("ar-SA")} ر.س
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">
                القيمة الشهرية
              </p>
              <p className="font-semibold">
                {data.monthlyValue.toLocaleString("ar-SA")} ر.س
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">
                تاريخ البداية
              </p>
              <p className="font-semibold">
                {new Date(data.startDate).toLocaleDateString("ar-SA")}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">
                تاريخ النهاية
              </p>
              <p className="font-semibold">
                {new Date(data.endDate).toLocaleDateString("ar-SA")}
              </p>
            </div>
          </div>

          {/* ── PDF Download ─────────────────────────────────────────────── */}
          {fileUrl ? (
            <div className="flex items-center gap-3 rounded-xl border bg-slate-50 p-4">
              <FileText className="w-8 h-8 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">ملف العقد</p>
                <p className="text-xs text-muted-foreground">
                  راجع العقد كاملاً قبل التوقيع
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
                  تحميل العقد
                </Button>
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                لا يوجد ملف مرفق لهذا العقد.
              </p>
            </div>
          )}

          {/* ── Signed confirmation ──────────────────────────────────────── */}
          {data.status === "SIGNED" && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm text-emerald-700 font-medium">
                  تم توقيع هذا العقد.
                </p>
                {data.signedAt && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {new Date(data.signedAt).toLocaleString("ar-SA")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Sign form (only when SENT) ──────────────────────────────── */}
          {canSign && (
            <div className="space-y-4 rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">توقيع العقد</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="signedByName" className="text-sm">
                    الاسم الكامل <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="signedByName"
                    placeholder="اكتب اسمك الكامل"
                    value={signedByName}
                    onChange={(e) => setSignedByName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="signedByEmail" className="text-sm">
                    البريد الإلكتروني (اختياري)
                  </Label>
                  <Input
                    id="signedByEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={signedByEmail}
                    onChange={(e) => setSignedByEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                onClick={handleSign}
                disabled={signing || !signedByName.trim()}
                className="w-full gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {signing ? "جارٍ التوقيع..." : "أوافق وأوقّع العقد"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                بالتوقيع، تقر بأنك قرأت العقد وتوافق على جميع شروطه.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
