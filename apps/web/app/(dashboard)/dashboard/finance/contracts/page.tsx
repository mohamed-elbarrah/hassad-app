"use client";

import { useGetFinanceContractsQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, DollarSign, PieChart, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ContractsFinancePage() {
  const { data: contracts = [], isLoading } = useGetFinanceContractsQuery();

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalValue = contracts.reduce((sum, c) => sum + c.totalValue, 0);
  const totalPaid = contracts.reduce((sum, c) => sum + c.paid, 0);
  const totalRemaining = totalValue - totalPaid;
  const averageCollectionRate = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الوضع المالي للعقود</h1>
        <p className="text-muted-foreground">متابعة تحصيل الدفعات مقارنة بالقيمة الإجمالية للعقود.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>إجمالي قيمة العقود</CardDescription>
            <CardTitle className="text-2xl font-bold">{totalValue.toLocaleString()} ر.س</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 ml-1 text-emerald-500" />
              <span>+5% عن الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>المبالغ المحصلة</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">{totalPaid.toLocaleString()} ر.س</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={averageCollectionRate} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-2">{averageCollectionRate.toFixed(1)}% من إجمالي القيمة</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>المبالغ المتبقية</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">{totalRemaining.toLocaleString()} ر.س</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3 ml-1" />
              <span>بانتظار الفواتير القادمة</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>عقود نشطة</CardDescription>
            <CardTitle className="text-2xl font-bold">{contracts.length} عقد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <PieChart className="w-3 h-3 ml-1 text-blue-500" />
              <span>إجمالي العقود المسجلة</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="البحث عن عقد أو عميل..." className="pr-10" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العقد</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>القيمة الإجمالية</TableHead>
                <TableHead>المحصل</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>نسبة التحصيل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    <div>{contract.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{contract.id.substring(0, 8)}...</div>
                  </TableCell>
                  <TableCell>{contract.client?.companyName || 'N/A'}</TableCell>
                  <TableCell className="font-bold">{contract.totalValue.toLocaleString()} ر.س</TableCell>
                  <TableCell className="text-emerald-600 font-medium">{contract.paid.toLocaleString()} ر.س</TableCell>
                  <TableCell className="text-rose-600 font-medium">{contract.remaining.toLocaleString()} ر.س</TableCell>
                  <TableCell className="w-[150px]">
                    <div className="space-y-1">
                      <Progress value={contract.collectionRate} className="h-1.5" />
                      <span className="text-[10px] text-muted-foreground">{contract.collectionRate.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <FinanceStatusBadge status={contract.status} />
                  </TableCell>
                  <TableCell className="text-left">
                    <Link href={`/dashboard/finance/contracts/${contract.id}`}>
                      <Button variant="ghost" size="sm">التفاصيل</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">لا توجد عقود مسجلة.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
