"use client";

import { FINANCE_DATA } from "@/lib/finance-mock";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Wallet, CheckCircle, Clock, AlertCircle, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function PayrollPage() {
  const { employees } = FINANCE_DATA;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الرواتب والأجور</h1>
          <p className="text-muted-foreground">إدارة مستحقات الموظفين والبدلات والاستقطاعات.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">إدارة الهيكل الوظيفي</Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Wallet className="w-4 h-4 ml-2" />
            صرف الرواتب الجماعي
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>إجمالي رواتب الشهر الحالي</CardDescription>
            <CardTitle className="text-2xl font-bold">145,000 ر.س</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3" />
              تم صرف 80%
            </div>
            <div className="flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded">
              <Clock className="w-3 h-3" />
              متبقي 20%
            </div>
          </CardContent>
        </Card>
        {/* Add more stats if needed */}
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
                <TableHead>البدلات / الحوافز</TableHead>
                <TableHead>الاستقطاعات</TableHead>
                <TableHead>صافي الراتب</TableHead>
                <TableHead>آخر تاريخ صرف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const netSalary = employee.baseSalary + (employee.bonuses || 0) - (employee.deductions || 0);
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
                    <TableCell className="text-emerald-600">+{employee.bonuses?.toLocaleString() || 0} ر.س</TableCell>
                    <TableCell className="text-rose-600">-{employee.deductions?.toLocaleString() || 0} ر.س</TableCell>
                    <TableCell className="font-bold text-primary">{netSalary.toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{employee.lastPayment}</TableCell>
                    <TableCell>
                      <FinanceStatusBadge status={employee.status} />
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
