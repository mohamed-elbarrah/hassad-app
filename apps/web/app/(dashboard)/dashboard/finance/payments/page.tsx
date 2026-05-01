"use client";

import { FINANCE_DATA } from "@/lib/finance-mock";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, ExternalLink, CreditCard, Banknote, Landmark } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PaymentsPage() {
  const { payments } = FINANCE_DATA;

  const getMethodIcon = (method: string) => {
    if (method.includes("Stripe")) return <CreditCard className="w-4 h-4 ml-2 text-blue-500" />;
    if (method.includes("بنك")) return <Landmark className="w-4 h-4 ml-2 text-slate-500" />;
    return <Banknote className="w-4 h-4 ml-2 text-emerald-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تتبع المدفوعات</h1>
          <p className="text-muted-foreground">سجل شامل لجميع العمليات المالية الواردة.</p>
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
              <p className="text-sm font-medium text-emerald-600">مدفوعات ناجحة</p>
              <h3 className="text-2xl font-bold">24,500 ر.س</h3>
            </div>
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/50 dark:bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">قيد المعالجة</p>
              <h3 className="text-2xl font-bold">12,000 ر.س</h3>
            </div>
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600">
              <Filter className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50/50 dark:bg-rose-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-600">مدفوعات فاشلة</p>
              <h3 className="text-2xl font-bold">1,200 ر.س</h3>
            </div>
            <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600">
              <Search className="w-5 h-5" />
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
                <Input placeholder="بحث برقم العملية أو العميل..." className="pr-10" />
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
                  <TableCell className="font-mono text-xs font-semibold">{p.id}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/finance/invoices/${p.invoiceId}`} className="flex items-center hover:text-primary transition-colors">
                      {p.invoiceId}
                      <ExternalLink className="w-3 h-3 mr-1" />
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{p.clientName}</TableCell>
                  <TableCell className="font-bold">{p.amount.toLocaleString()} ر.س</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getMethodIcon(p.method)}
                      {p.method}
                    </div>
                  </TableCell>
                  <TableCell>
                    <FinanceStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-left text-xs text-muted-foreground">{p.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
