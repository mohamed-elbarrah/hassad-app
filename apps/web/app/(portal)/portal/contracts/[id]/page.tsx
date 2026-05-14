"use client";

import { useState, use, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  PenLine,
} from "lucide-react";
import {
  useSignContractByTokenMutation,
} from "@/features/contracts/contractsApi";
import { useGetPortalContractByIdQuery } from "@/features/portal/portalApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractPaymentSummary } from "@/components/shared/ContractPaymentSummary";
import { toast } from "sonner";

import { buildPortalFileUrl } from "@/lib/portal-files";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "بانتظار توقيعك",
  SIGNED: "موقَّع",
  ACTIVE: "ساري",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  SENT: "default",
  SIGNED: "secondary",
  ACTIVE: "secondary",
  EXPIRED: "outline",
  CANCELLED: "destructive",
};

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "شهري ثابت",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

export default function PortalContractDetailPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    }>
      <PortalContractDetailInner id={id} />
    </Suspense>
  );
}

function PortalContractDetailInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useGetPortalContractByIdQuery(id);
  const [signContract, { isLoading: signing }] =
    useSignContractByTokenMutation();

  const [signedByName, setSignedByName] = useState("");
  const [signedByEmail, setSignedByEmail] = useState("");

  useEffect(() => {
    if (searchParams.get("stripe_success") === "true") {
      toast.success("تم دفع الفاتورة بنجاح! يمكنك الآن توقيع العقد.", {
        duration: 6000,
      });
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/portal/contracts">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العقود
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6 text-center text-destructive text-sm">
            العقد غير متوفر.
          </CardContent>
        </Card>
      </div>
    );
  }

  const canSign = data.status === "SENT" && !!data.shareLinkToken;
  const invoices = data.invoices ?? [];

  const allInvoicesPaid =
    invoices.length > 0 && invoices.every((inv) => inv.status === "PAID");
  const canSignNow =
    canSign && allInvoicesPaid && signedByName.trim() && signedByEmail.trim();
  const fileUrl = data.filePath ? buildPortalFileUrl(data.filePath) : null;

  async function handleSign() {
    if (!signedByName.trim()) {
      toast.error("يرجى كتابة اسمك الكامل قبل التوقيع");
      return;
    }
    try {
      await signContract({
        token: data.shareLinkToken,
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
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center gap-2">
        <Link href="/portal/contracts">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            العقود
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
              {data.client?.companyName && (
                <p className="text-sm text-muted-foreground mt-1">
                  {data.client.companyName}
                  {data.client.contactName
                    ? ` — ${data.client.contactName}`
                    : ""}
                </p>
              )}
              {data.type && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {TYPE_LABELS[data.type] ?? data.type}
                </p>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[data.status] ?? "outline"}>
              {STATUS_LABELS[data.status] ?? data.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">
                القيمة الإجمالية
              </p>
              <p className="font-semibold">
                {data.totalValue.toLocaleString("ar-DZ")} د.ج
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">
                القيمة الشهرية
              </p>
              <p className="font-semibold">
                {data.monthlyValue.toLocaleString("ar-DZ")} د.ج
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">
                تاريخ البداية
              </p>
              <p className="font-semibold">
                {new Date(data.startDate).toLocaleDateString("ar-DZ")}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">
                تاريخ النهاية
              </p>
              <p className="font-semibold">
                {new Date(data.endDate).toLocaleDateString("ar-DZ")}
              </p>
            </div>
          </div>

          {fileUrl ? (
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0"
                >
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

          <ContractPaymentSummary
            services={data.servicesList ?? []}
            totalValue={data.totalValue}
            invoices={invoices}
            showPayButton={canSign}
            onPaymentComplete={() => window.location.reload()}
          />

          {data.status === "SIGNED" && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm text-emerald-700 font-medium">
                  تم توقيع هذا العقد.
                </p>
                {data.signedAt && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {new Date(data.signedAt).toLocaleString("ar-DZ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {canSign && (
            <div className="space-y-4 rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">توقيع العقد</p>
              </div>

              {!allInvoicesPaid && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700">
                    يجب دفع جميع الفواتير قبل توقيع العقد. اضغط على زر
                    &quot;ادفع&quot; بجانب كل فاتورة.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label htmlFor="signedByName" className="text-sm">
                    الاسم الكامل{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="signedByName"
                    placeholder="اكتب اسمك الكامل"
                    value={signedByName}
                    onChange={(e) => setSignedByName(e.target.value)}
                    className="mt-1"
                    disabled={!allInvoicesPaid}
                  />
                </div>
                <div>
                  <Label htmlFor="signedByEmail" className="text-sm">
                    البريد الإلكتروني{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="signedByEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={signedByEmail}
                    onChange={(e) => setSignedByEmail(e.target.value)}
                    className="mt-1"
                    disabled={!allInvoicesPaid}
                  />
                </div>
              </div>
              <Button
                onClick={handleSign}
                disabled={signing || !canSignNow}
                className="w-full gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {!allInvoicesPaid
                  ? "يجب دفع الفواتير أولاً"
                  : signing
                    ? "جارٍ التوقيع..."
                    : "أوافق وأوقّع العقد"}
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
