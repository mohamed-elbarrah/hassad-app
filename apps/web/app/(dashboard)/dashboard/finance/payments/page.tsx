"use client";

import { useGetPaymentsQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  CreditCard,
  Banknote,
  Landmark,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useState } from "react";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetPaymentsQuery({ page });

  const getMethodIcon = (method: string) => {
    if (method.includes("VISA") || method.includes("MADA"))
      return <CreditCard className="w-4 h-4 ml-2 text-blue-500" />;
    if (method.includes("BANK_TRANSFER"))
      return <Landmark className="w-4 h-4 ml-2 text-slate-500" />;
    return <Banknote className="w-4 h-4 ml-2 text-emerald-500" />;
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const payments = data?.items || [];
  const totalSuccessful = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تتبع المدفوعات</h1>
          <p className="text-muted-foreground">
            سجل شامل لجميع العمليات المالية الواردة.
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 ml-2" />
          تحميل كشف الحساب
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-emerald-50/50 dark:bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">
                مدفوعات ناجحة (هذه الصفحة)
              </p>
              <h3 className="text-2xl font-bold">
                {totalSuccessful.toLocaleString()} ر.س
              </h3>
            </div>
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs defaultValue="all" className="w-full md:w-auto">
              <TabsList className="grid grid-cols-3 w-full md:w-[300px]">
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="success">ناجحة</TabsTrigger>
                <TabsTrigger value="failed">فاشلة</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-1 items-center gap-2 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم العملية أو العميل..."
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم العملية</TableHead>
                <TableHead>الفاتورة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-[10px] font-semibold">
                    {p.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/finance/invoices/${p.invoiceId}`}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      {p.invoice?.invoiceNumber || "N/A"}
                      <ExternalLink className="w-3 h-3 mr-1" />
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.invoice?.client?.companyName || "N/A"}
                  </TableCell>
                  <TableCell className="font-bold">
                    {p.amount.toLocaleString()} ر.س
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getMethodIcon(p.method)}
                      {p.method}
                    </div>
                  </TableCell>
                  <TableCell>
                    <FinanceStatusBadge status={p.status as any} />
                  </TableCell>
                  <TableCell className="text-left text-xs text-muted-foreground">
                    {new Date(p.date).toLocaleDateString("ar-SA-u-nu-latn")}
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    لا توجد عمليات مسجلة.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
