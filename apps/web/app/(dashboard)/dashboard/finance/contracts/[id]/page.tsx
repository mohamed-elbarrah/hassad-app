"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  DollarSign,
  TrendingUp,
  PieChart,
  FileText,
  Download,
} from "lucide-react";
import { useGetContractByIdQuery } from "@/features/contracts/contractsApi";
import { ContractServicesTable } from "@/components/shared/ContractServicesTable";
import { ContractInvoicesList } from "@/components/shared/ContractInvoicesList";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  params: Promise<{ id: string }>;
}

function buildFileUrl(filePath: string): string {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace("/v1", "") ??
    "http://localhost:3001";
  return filePath.startsWith("http") ? filePath : `${apiBase}${filePath}`;
}

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "اشتراك شهري",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

export default function FinanceContractDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isLoading, isError } = useGetContractByIdQuery(id);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/dashboard/finance/contracts">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العقود المالية
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6 text-center text-destructive text-sm">
            العقد غير موجود.
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPaid =
    data.invoices?.reduce((acc, inv) => {
      const invPayments = inv.payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
      return acc + invPayments;
    }, 0) ?? 0;

  const totalValue = data.totalValue;
  const remaining = totalValue - totalPaid;
  const collectionRate =
    totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
  const invoiceCount = data.invoices?.length ?? 0;
  const fileUrl = data.filePath ? buildFileUrl(data.filePath) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/finance/contracts">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            العقود المالية
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium truncate max-w-xs">
          {data.title}
        </span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <FinanceStatusBadge status={data.status} />
            <span className="text-xs text-muted-foreground">
              {TYPE_LABELS[data.type] ?? data.type}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.client?.companyName}
          {data.client?.contactName ? ` — ${data.client.contactName}` : ""}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>القيمة الإجمالية</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {totalValue.toLocaleString()} ر.س
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3 ml-1" />
              <span>{invoiceCount} فاتورة</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>المحصل</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {totalPaid.toLocaleString()} ر.س
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={collectionRate} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-2">
              {collectionRate.toFixed(1)}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>المتبقي</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">
              {remaining.toLocaleString()} ر.س
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 ml-1" />
              <span>بعد خصم الدفعات</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>نسبة التحصيل</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {collectionRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <PieChart className="w-3 h-3 ml-1 text-blue-500" />
              <span>معدل الدفع</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ContractServicesTable
          services={data.servicesList ?? []}
          totalValue={totalValue}
        />
        <ContractInvoicesList invoices={data.invoices ?? []} />
      </div>

      {fileUrl && (
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <FileText className="w-8 h-8 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">ملف العقد</p>
                <p className="text-xs text-muted-foreground">
                  تحميل ملف العقد بصيغة PDF
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
          </CardContent>
        </Card>
      )}

      {data.invoices && data.invoices.length > 0 && (
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>سجل الدفعات</CardTitle>
            <CardDescription>
              جميع الدفعات المسجلة عبر فواتير هذا العقد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.flatMap((inv) =>
                  (inv.payments ?? []).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-medium text-emerald-600">
                        {payment.amount.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        BANK_TRANSFER
                      </TableCell>
                      <TableCell>
                        <FinanceStatusBadge status={payment.status} />
                      </TableCell>
                    </TableRow>
                  )),
                )}
                {data.invoices.every(
                  (inv) => (inv.payments ?? []).length === 0,
                ) && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      لا توجد دفعات مسجلة بعد.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
