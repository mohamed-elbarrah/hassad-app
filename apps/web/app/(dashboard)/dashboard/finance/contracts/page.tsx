"use client";

import { FINANCE_DATA } from "@/lib/finance-mock";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, DollarSign, PieChart } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ContractsFinancePage() {
  const { contracts } = FINANCE_DATA;

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
            <CardTitle className="text-2xl font-bold">1,450,000 ر.س</CardTitle>
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
            <CardTitle className="text-2xl font-bold text-emerald-600">920,000 ر.س</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={63.4} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-2">63.4% من إجمالي القيمة</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>المبالغ المتبقية</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">530,000 ر.س</CardTitle>
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
            <CardDescription>عقود مكتملة الدفع</CardTitle>
            <CardTitle className="text-2xl font-bold">12 عقد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <PieChart className="w-3 h-3 ml-1 text-blue-500" />
              <span>من أصل 45 عقد نشط</span>
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
              {contracts.map((contract) => {
                const percentage = (contract.paid / contract.totalValue) * 100;
                return (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      <div>{contract.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{contract.id}</div>
                    </TableCell>
                    <TableCell>{contract.clientName}</TableCell>
                    <TableCell className="font-bold">{contract.totalValue.toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-emerald-600 font-medium">{contract.paid.toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-rose-600 font-medium">{contract.remaining.toLocaleString()} ر.س</TableCell>
                    <TableCell className="w-[150px]">
                      <div className="space-y-1">
                        <Progress value={percentage} className="h-1.5" />
                        <span className="text-[10px] text-muted-foreground">{percentage.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <FinanceStatusBadge status={contract.status} />
                    </TableCell>
                    <TableCell className="text-left">
                      <Button variant="ghost" size="sm">التفاصيل</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
