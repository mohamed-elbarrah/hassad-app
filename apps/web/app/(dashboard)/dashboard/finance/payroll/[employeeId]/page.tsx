"use client";

import { use } from "react";
import { useGetEmployeeByIdQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { TimelineComponent } from "@/components/dashboard/finance/TimelineComponent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Wallet, History, FileText, Plus, ArrowDown, ArrowUp, DollarSign, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SalaryDetailPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = use(params);
  
  const { data: employee, isLoading } = useGetEmployeeByIdQuery(employeeId);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return <div className="p-8 text-center text-muted-foreground">الموظف غير موجود</div>;
  }

  const netSalary = employee.baseSalary; // Bonuses/deductions are in the salaries history

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/finance" className="hover:text-primary">المالية</Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <Link href="/dashboard/finance/payroll" className="hover:text-primary">الرواتب</Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-foreground font-medium">{employee.name}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 ml-2" />
            تصدير مسير الرواتب
          </Button>
          <Button size="sm">
            <Wallet className="w-4 h-4 ml-2" />
            صرف المستحقات الحالية
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card className="border-none shadow-md">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-lg">
                  <AvatarFallback className="text-3xl font-bold bg-primary/5 text-primary">
                    {employee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <h2 className="text-3xl font-bold">{employee.name}</h2>
                    <FinanceStatusBadge status="ACTIVE" className="w-fit self-center" />
                  </div>
                  <p className="text-muted-foreground text-lg">{employee.role}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                    <div className="bg-muted/50 px-4 py-2 rounded-lg text-sm">
                      <span className="text-muted-foreground ml-2">المعرف:</span>
                      <span className="font-mono font-medium">{employee.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
 
          {/* Salary Breakdown */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> الراتب الأساسي
                </CardDescription>
                <CardTitle className="text-xl font-bold">{employee.baseSalary.toLocaleString()} ر.س</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1 text-emerald-600">
                  <ArrowUp className="w-3 h-3" /> الحوافز والبدلات
                </CardDescription>
                <CardTitle className="text-xl font-bold text-emerald-600">0 ر.س</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1 text-rose-600">
                  <ArrowDown className="w-3 h-3" /> الإستقطاعات
                </CardDescription>
                <CardTitle className="text-xl font-bold text-rose-600">0 ر.س</CardTitle>
              </CardHeader>
            </Card>
          </div>
 
          {/* Payment History */}
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  سجل الدفعات السابقة
                </CardTitle>
                <CardDescription>عرض جميع الرواتب التي تم صرفها لهذا الموظف</CardDescription>
              </div>
              <Button variant="outline" size="sm">تحميل السجل</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر / السنة</TableHead>
                    <TableHead>المبلغ المصروف</TableHead>
                    <TableHead>تاريخ الصرف</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.salaries?.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.month}/{h.year}</TableCell>
                      <TableCell className="font-bold">{h.amount.toLocaleString()} ر.س</TableCell>
                      <TableCell>{h.paymentDate ? new Date(h.paymentDate).toLocaleDateString('ar-SA') : '—'}</TableCell>
                      <TableCell>
                        <FinanceStatusBadge status={h.status as any} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!employee.salaries || employee.salaries.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">لا توجد سجلات رواتب.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
 
        {/* Sidebar: Details & Timeline */}
        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>الجدول الزمني</CardTitle>
              <CardDescription>إجراءات الصرف الحالية</CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineComponent 
                items={[]} 
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">إدارة البدلات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>بدل سكن</span>
                <span className="font-bold">1,000 ر.س</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>بدل نقل</span>
                <span className="font-bold">500 ر.س</span>
              </div>
              <Separator />
              <Button variant="outline" className="w-full text-xs">
                <Plus className="w-3 h-3 ml-1" />
                إضافة بدل أو استقطاع
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
