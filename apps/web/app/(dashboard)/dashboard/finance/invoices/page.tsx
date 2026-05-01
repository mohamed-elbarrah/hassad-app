"use client";

import { FINANCE_DATA } from "@/lib/finance-mock";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Eye, Download, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function InvoicesPage() {
  const { invoices } = FINANCE_DATA;

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
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="group transition-colors">
                  <TableCell className="font-mono text-sm font-semibold">{invoice.id}</TableCell>
                  <TableCell className="font-medium">{invoice.clientName}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.contractName}</TableCell>
                  <TableCell className="font-bold">{invoice.amount.toLocaleString()} ر.س</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {invoice.paidAmount.toLocaleString()} ر.س
                  </TableCell>
                  <TableCell>
                    <FinanceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{invoice.dueDate}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
