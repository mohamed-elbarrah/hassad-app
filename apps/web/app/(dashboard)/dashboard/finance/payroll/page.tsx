"use client";

import { useGetEmployeesQuery, useRunPayrollMutation } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Wallet, CheckCircle, Clock, AlertCircle, ChevronLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

export default function PayrollPage() {
  const { data: employees = [], isLoading } = useGetEmployeesQuery();
  const [runPayroll, { isLoading: isRunning }] = useRunPayrollMutation();

  const handleRunPayroll = async () => {
    try {
      const now = new Date();
      await runPayroll({ month: now.getMonth() + 1, year: now.getFullYear() }).unwrap();
      toast.success("تم بدء عملية صرف الرواتب بنجاح");
    } catch (error) {
      toast.error("فشل في عملية صرف الرواتب");
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPayroll = employees.reduce((sum, emp) => sum + emp.baseSalary, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الرواتب والأجور</h1>
          <p className="text-muted-foreground">إدارة مستحقات الموظفين والبدلات والاستقطاعات.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">إدارة الهيكل الوظيفي</Button>
          <Button 
            className="bg-primary hover:bg-primary/90" 
            onClick={handleRunPayroll}
            disabled={isRunning}
          >
            {isRunning ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Wallet className="w-4 h-4 ml-2" />}
            صرف الرواتب الجماعي
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>إجمالي رواتب الشهر الحالي</CardDescription>
            <CardTitle className="text-2xl font-bold">{totalPayroll.toLocaleString()} ر.س</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3" />
              تكامل النظام: نشط
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث عن موظف..." className="pr-10" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">تاريخ الصرف</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>الراتب الأساسي</TableHead>
                <TableHead>آخر تاريخ صرف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const latestSalary = (employee as any).salaries?.[0];
                return (
                  <TableRow key={employee.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-muted">
                          <AvatarFallback className="bg-primary/5 text-primary font-bold">
                            {employee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.baseSalary.toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {latestSalary?.paymentDate ? new Date(latestSalary.paymentDate).toLocaleDateString('ar-SA') : 'لم يتم الصرف'}
                    </TableCell>
                    <TableCell>
                      <FinanceStatusBadge status={latestSalary?.status || 'PENDING'} />
                    </TableCell>
                    <TableCell className="text-left">
                      <Link href={`/dashboard/finance/payroll/${employee.id}`}>
                        <Button variant="ghost" size="icon" className="group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">لا يوجد موظفون مسجلون.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
