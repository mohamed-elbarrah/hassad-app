"use client";

import { useGetLedgerQuery } from "@/features/finance/financeApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, Download, Filter, User, Calendar, ArrowRightLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function LedgerPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetLedgerQuery({ page });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const ledger = data?.items || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">سجل التدقيق المالي</h1>
            <p className="text-muted-foreground">تتبع جميع التغييرات والعمليات المالية بدقة (نظام غير قابل للحذف).</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 ml-2" />
          تصدير سجل التدقيق
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard title="إجمالي العمليات" value={data?.total || 0} icon={ArrowRightLeft} />
        <StatCard title="عمليات اليوم" value={ledger.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length} icon={Calendar} />
        <StatCard title="تعديلات حساسة" value={ledger.filter(l => l.action.includes('PAYROLL') || l.action.includes('PAYMENT')).length} icon={Filter} className="text-amber-600" />
        <StatCard title="تكامل النظام" value="نشط" icon={ShieldCheck} className="text-emerald-600" />
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث في السجلات..." className="pr-10" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">تصفية حسب المستخدم</Button>
              <Button variant="outline" size="sm">تصفية حسب التاريخ</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pr-6">العملية</TableHead>
                <TableHead>الكيان المتأثر</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>القيمة السابقة</TableHead>
                <TableHead>القيمة الجديدة</TableHead>
                <TableHead className="text-left pl-6">التاريخ والوقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((log) => (
                <TableRow key={log.id} className="group transition-colors border-b last:border-0">
                  <TableCell className="pr-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="font-bold text-sm">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {log.entity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm">{log.userId || 'System'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {log.before ? (typeof log.before === 'string' ? log.before : JSON.stringify(log.before).substring(0, 30) + '...') : '-'}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-primary">
                    {log.after ? (typeof log.after === 'string' ? log.after : JSON.stringify(log.after).substring(0, 30) + '...') : '-'}
                  </TableCell>
                  <TableCell className="text-left pl-6 text-muted-foreground text-xs font-mono">
                    {new Date(log.createdAt).toLocaleString('ar-SA')}
                  </TableCell>
                </TableRow>
              ))}
              {ledger.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">لا توجد سجلات حالياً.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, className }: { title: string, value: string | number, icon: any, className?: string }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className={cn("text-xl font-bold", className)}>{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
