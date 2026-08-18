"use client";

import { useMemo, useState } from "react";
import { CreditCard, Filter, Receipt, Search, X } from "lucide-react";
import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useGetPortalFinanceSummaryQuery,
  useGetPortalInvoicesQuery,
} from "@/features/portal/portalApi";
import {
  PaymentSheet,
  type PayableInvoice,
} from "@/components/payments/PaymentSheet";
import { FinanceSummaryKpis } from "@/components/portal/finance";
import { DomainStatusPill } from "@/components/portal/shared/DomainStatusPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatShortDateLong,
  isInvoicePayable,
} from "@/lib/format";
const PAGE_SIZE = 7;
export default function PortalFinancePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState<PayableInvoice | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { data: summary, isLoading: summaryLoading } =
    useGetPortalFinanceSummaryQuery(undefined, {
      pollingInterval: PORTAL_POLLING_INTERVAL_MS,
    });
  const { data, isLoading, isError } = useGetPortalInvoicesQuery(
    { status: statuses[0], page, limit: PAGE_SIZE },
    { pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );
  const invoices = data?.data ?? [];
  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(
      (invoice) =>
        !q ||
        invoice.invoiceNumber.toLowerCase().includes(q) ||
        invoice.contract?.title.toLowerCase().includes(q),
    );
  }, [invoices, search]);
  const options = [...new Set(invoices.map((invoice) => invoice.status))];
  const toggle = (status: string) => {
    setStatuses((current) => (current.includes(status) ? [] : [status]));
    setPage(1);
  };
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="الفواتير والمدفوعات"
        description="استعرض فواتيرك، حالة الدفع، والمبالغ المستحقة."
        icon={Receipt}
      />
      <FinanceSummaryKpis data={summary} isLoading={summaryLoading} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9 pe-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="ابحث برقم الفاتورة أو العقد..."
          />
          {search ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-1 top-1/2 size-8 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X />
            </Button>
          ) : null}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter />
              الحالة
              {statuses.length ? <Badge variant="secondary">1</Badge> : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            collisionPadding={16}
            className="flex w-max max-w-[calc(100vw-2rem)] flex-col gap-3 p-4"
            dir="rtl"
          >
            <div>
              <p className="font-medium">حالة الفاتورة</p>
              <p className="text-sm text-muted-foreground">اختر حالة واحدة.</p>
            </div>
            <Separator />
            {options.map((status) => {
              const id = `invoice-status-${status}`;
              const selected = statuses.includes(status);
              return (
                <Label
                  key={status}
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Checkbox
                    id={id}
                    checked={selected}
                    onCheckedChange={() => toggle(status)}
                  />
                  {status}
                </Label>
              );
            })}
            {statuses.length ? (
              <Button variant="ghost" size="sm" onClick={() => setStatuses([])}>
                مسح الفلتر
              </Button>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>
      <Card>
        {isLoading ? (
          <CardContent className="flex flex-col gap-3 pt-6">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </CardContent>
        ) : isError ? (
          <CardContent className="pt-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Receipt />
                </EmptyMedia>
                <EmptyTitle>تعذر تحميل الفواتير</EmptyTitle>
                <EmptyDescription>حاول تحديث الصفحة مرة أخرى.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : visible.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>
                  <span className="sr-only">الإجراء</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.contract?.title}
                    </p>
                  </TableCell>
                  <TableCell>
                    {formatShortDateLong(invoice.issueDate ?? invoice.dueDate)}
                  </TableCell>
                  <TableCell>
                    <p>{formatCurrency(invoice.amount)}</p>
                    {invoice.remainingAmount > 0 &&
                    invoice.remainingAmount !== invoice.amount ? (
                      <p className="text-sm text-muted-foreground">
                        متبقي {formatCurrency(invoice.remainingAmount)}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <DomainStatusPill
                      domain="invoice"
                      status={invoice.status}
                    />
                  </TableCell>
                  <TableCell>
                    {isInvoicePayable(
                      invoice.status,
                      invoice.remainingAmount,
                    ) ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelected({
                            id: invoice.id,
                            invoiceNumber: invoice.invoiceNumber,
                            amount: invoice.amount,
                            status: invoice.status,
                          });
                          setPaymentOpen(true);
                        }}
                      >
                        <CreditCard />
                        دفع
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardContent className="pt-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Receipt />
                </EmptyMedia>
                <EmptyTitle>لا توجد فواتير مطابقة</EmptyTitle>
                <EmptyDescription>جرّب تغيير البحث أو الفلتر.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        )}
      </Card>
      <PaymentSheet
        invoice={selected}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
    </main>
  );
}
