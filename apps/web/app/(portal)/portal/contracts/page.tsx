"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileSignature, ExternalLink, Search, Calendar, Filter, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetPortalContractsQuery } from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "قيد التوقيع",
  SIGNED: "موقّع",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  SENT: "bg-orange-100 text-orange-600 border-orange-200",
  SIGNED: "bg-blue-100 text-blue-600 border-blue-200",
  ACTIVE: "bg-emerald-100 text-emerald-600 border-emerald-200",
  EXPIRED: "bg-rose-100 text-rose-600 border-rose-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "شهري ثابت",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

function fmt(n: number) {
  return n.toLocaleString("ar-SA-u-nu-latn");
}

export default function PortalContractsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const {
    data: contractsData,
    isLoading,
    isError,
  } = useGetPortalContractsQuery({
    page,
    limit: 10,
    search,
    dateFrom: dateRange.from?.toISOString(),
    dateTo: dateRange.to?.toISOString(),
  });

  const contracts = contractsData?.data ?? [];
  const totalEntries = contractsData?.total ?? 0;
  const totalPages = Math.ceil(totalEntries / 10);

  const toggleRow = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const toggleAll = () => {
    if (selectedRows.size === contracts.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(contracts.map((c: any) => c.id)));
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">العقود</h1>
          <p className="text-sm text-muted-foreground mt-1">
            هنا يمكنك استعراض جميع عقودك، تحميلها، أو توقيعها إلكترونياً.
          </p>
        </div>
        <Button variant="outline" className="w-fit gap-2 text-sm">
          <FileSignature className="h-4 w-4" />
          تحميل كافة العقود
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full max-w-md shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث..."
            className="border-none focus-visible:ring-0 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2" size="sm">
                <CalendarIcon className="h-4 w-4" />
                {dateRange.from ? (
                  `${format(dateRange.from, "dd MMM yyyy", { locale: ar })} - ${dateRange.to ? format(dateRange.to, "dd MMM yyyy", { locale: ar }) : "اليوم"}`
                ) : (
                  "اختر التاريخ"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 flex flex-col gap-2">
                <span className="text-xs font-medium">تحديد الفترة</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: new Date(new Date().setDate(new Date().getDate() - 7)), to: new Date() })}>
                    آخر 7 أيام
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: new Date(), to: new Date() })}>
                    اليوم
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            تصفية
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-12 text-right">
                <Checkbox 
                  checked={selectedRows.size === contracts.length && contracts.length > 0} 
                  onCheckedChange={toggleAll} 
                />
              </TableHead>
              <TableHead className="text-right font-semibold">اسم العقد ↓</TableHead>
              <TableHead className="text-right font-semibold">نوع العقد ↓</TableHead>
              <TableHead className="text-right font-semibold">تاريخ البداية - النهاية ↓</TableHead>
              <TableHead className="text-right font-semibold">قيمة العقد ↓</TableHead>
              <TableHead className="text-right font-semibold">مدير المشروع ↓</TableHead>
              <TableHead className="text-right font-semibold">الحالة ↓</TableHead>
              <TableHead className="text-right font-semibold">الإجراءات ↓</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-10">
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && isError && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-destructive py-10">
                  حدث خطأ أثناء تحميل العقود.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && contracts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-20">
                  <div className="flex flex-col items-center gap-2">
                    <FileSignature className="h-12 w-12 opacity-20" />
                    <span>لا توجد عقود متاحة حالياً.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && contracts.map((contract: any) => (
              <TableRow key={contract.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <Checkbox 
                    checked={selectedRows.has(contract.id)} 
                    onCheckedChange={() => toggleRow(contract.id)} 
                  />
                </TableCell>
                <TableCell className="font-medium text-slate-700">
                  {contract.title}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {TYPE_LABELS[contract.type] ?? contract.type}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {format(new Date(contract.startDate), "dd MMMM yyyy", { locale: ar })} 
                  {" ← "} 
                  {format(new Date(contract.endDate), "dd MMMM yyyy", { locale: ar })}
                </TableCell>
                <TableCell className="text-slate-700 font-medium text-sm">
                  {fmt(contract.totalValue)} ر.س
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {contract.projectManager || "غير معين"}
                </TableCell>
                <TableCell>
                  <Badge 
                    className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", STATUS_STYLES[contract.status])}
                  >
                    {STATUS_LABELS[contract.status] ?? contract.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild className="gap-2">
                        <Link 
                          href={`/portal/contracts/${contract.shareLinkToken}`}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {contract.status === "SENT" ? "توقيع العقد" : "استعراض العقد"}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/30">
          <div className="text-sm text-muted-foreground">
            الصفحة {page} من {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <Button 
                  key={i} 
                  variant={page === i + 1 ? "default" : "outline"} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              {totalPages > 5 && <span>...</span>}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

