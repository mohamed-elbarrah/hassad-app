"use client";

import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Eye, Download, MoreHorizontal, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState } from "react";

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetInvoicesQuery({ page });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const invoices = data?.items || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الفواتير</h1>
          <p className="text-muted-foreground">عرض وإدارة فواتير العملاء وتحصيل المدفوعات.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير الكل
          </Button>
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            فاتورة جديدة
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="البحث عن فاتورة أو عميل..." className="pr-10" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="w-4 h-4 ml-2" />
                تصفية
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[150px]">رقم الفاتورة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>العقد</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const paidAmount = (invoice as any).payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                
                return (
                  <TableRow key={invoice.id} className="group transition-colors">
                    <TableCell className="font-mono text-sm font-semibold">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">{invoice.client?.companyName || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{(invoice as any).contract?.title || 'N/A'}</TableCell>
                    <TableCell className="font-bold">{invoice.amount.toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {paidAmount.toLocaleString()} ر.س
                    </TableCell>
                    <TableCell>
                      <FinanceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/finance/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-right">
                            <DropdownMenuLabel>إجراءات الفاتورة</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer flex justify-end">تسجيل دفعة</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer flex justify-end">تحميل PDF</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer flex justify-end">إرسال للعميل</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-rose-500 flex justify-end">إلغاء الفاتورة</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">لا توجد فواتير حالياً.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
