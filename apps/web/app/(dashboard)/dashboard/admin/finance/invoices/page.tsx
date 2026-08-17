"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  Search,
} from "lucide-react";
import {
  InvoiceStatus,
  PAYMENT_METHOD_AR,
  type Invoice,
} from "@hassad/shared";
import {
  useGetInvoiceByIdQuery,
  useGetInvoicesQuery,
  useSendInvoiceMutation,
  useSendInvoiceReminderMutation,
} from "@/features/finance/financeApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { daysUntil, formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

const INVOICE_STATUS_AR: Record<string, string> = {
  DUE: "مستحقة",
  SENT: "تم الإرسال",
  PAID: "مدفوعة",
  PARTIAL: "مدفوعة جزئياً",
  PENDING: "قيد الانتظار",
  LATE: "متأخرة",
  CANCELLED: "ملغاة",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAID: "secondary",
  PARTIAL: "outline",
  SENT: "outline",
  DUE: "outline",
  PENDING: "outline",
  LATE: "destructive",
  CANCELLED: "destructive",
};

const STATUS_TABS = [
  { value: "ALL", label: "الكل" },
  { value: InvoiceStatus.LATE, label: "متأخرة" },
  { value: InvoiceStatus.DUE, label: "مستحقة" },
  { value: InvoiceStatus.PARTIAL, label: "جزئية" },
  { value: InvoiceStatus.PAID, label: "مدفوعة" },
];

function getPaidAmount(invoice: Invoice) {
  return (invoice.payments || []).reduce(
    (sum: number, payment: any) => sum + (payment.amount || 0),
    0,
  );
}

function getRemainingAmount(invoice: Invoice) {
  return Math.max(0, invoice.amount - getPaidAmount(invoice));
}

function getInvoiceRisk(invoice: Invoice) {
  const days = daysUntil(invoice.dueDate);
  const remaining = getRemainingAmount(invoice);

  if (invoice.status === InvoiceStatus.PAID || remaining <= 0) {
    return { label: "محصلة", tone: "ok" as const };
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    return { label: "ملغاة", tone: "muted" as const };
  }
  if (days == null) {
    return { label: "بدون موعد", tone: "muted" as const };
  }
  if (days < 0) {
    return { label: `متأخرة ${Math.abs(days)} يوم`, tone: "danger" as const };
  }
  if (days === 0) {
    return { label: "تستحق اليوم", tone: "warning" as const };
  }
  if (days <= 7) {
    return { label: `تستحق خلال ${days} أيام`, tone: "warning" as const };
  }
  return { label: "ضمن المدة", tone: "ok" as const };
}

function RiskBadge({ invoice }: { invoice: Invoice }) {
  const risk = getInvoiceRisk(invoice);
  const className =
    risk.tone === "danger"
      ? "border-destructive/20 bg-destructive/10 text-destructive"
      : risk.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : risk.tone === "ok"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "";

  return (
    <Badge variant="outline" className={className}>
      {risk.label}
    </Badge>
  );
}

function InvoiceStatusPill({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] || "outline"}>
      {INVOICE_STATUS_AR[status] || status}
    </Badge>
  );
}

function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof FileText;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function InvoicesPageLoading() {
  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mt-4 h-96 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminFinanceInvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetInvoicesQuery({
    limit: 100,
    status: statusTab === "ALL" ? undefined : (statusTab as InvoiceStatus),
  });

  const [sendInvoice, { isLoading: isSendingInvoice }] = useSendInvoiceMutation();
  const [sendReminder, { isLoading: isSendingReminder }] = useSendInvoiceReminderMutation();

  const invoices = useMemo(() => data?.items ?? [], [data?.items]);
  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesSearch =
        !query ||
        [
          invoice.invoiceNumber,
          invoice.client?.companyName,
          invoice.contract?.title,
          invoice.paymentReference,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesMethod =
        paymentMethod === "ALL" || invoice.paymentMethod === paymentMethod;

      return matchesSearch && matchesMethod;
    });
  }, [invoices, paymentMethod, search]);

  const selectedInvoiceSummary = filteredInvoices.find((item) => item.id === selectedInvoiceId);
  const selectedInvoiceFallback = invoices.find((item) => item.id === selectedInvoiceId);
  const selectedInvoiceBase = selectedInvoiceSummary || selectedInvoiceFallback;

  const {
    data: selectedInvoiceDetail,
    isFetching: isInvoiceDetailLoading,
  } = useGetInvoiceByIdQuery(selectedInvoiceId || "", {
    skip: !selectedInvoiceId,
  });

  const selectedInvoice = selectedInvoiceDetail || selectedInvoiceBase || null;

  const metrics = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const collectedAmount = filteredInvoices.reduce(
      (sum, invoice) => sum + getPaidAmount(invoice),
      0,
    );
    const remainingAmount = filteredInvoices.reduce(
      (sum, invoice) => sum + getRemainingAmount(invoice),
      0,
    );
    const overdue = filteredInvoices.filter((invoice) => getInvoiceRisk(invoice).tone === "danger");
    const unpaid = filteredInvoices.filter((invoice) =>
      [InvoiceStatus.DUE, InvoiceStatus.LATE, InvoiceStatus.PARTIAL, InvoiceStatus.SENT].includes(
        invoice.status,
      ),
    );

    return {
      totalAmount,
      collectedAmount,
      remainingAmount,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, invoice) => sum + getRemainingAmount(invoice), 0),
      unpaidCount: unpaid.length,
      collectionRate:
        totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0,
    };
  }, [filteredInvoices]);

  const handleSendInvoice = async (invoiceId: string) => {
    await sendInvoice(invoiceId).unwrap();
    refetch();
  };

  const handleSendReminder = async (invoiceId: string) => {
    await sendReminder(invoiceId).unwrap();
    refetch();
  };

  if (isLoading) return <InvoicesPageLoading />;

  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">فواتير العملاء</CardTitle>
              <CardDescription>
                لوحة متابعة للتحصيل، المخاطر، وربط الفاتورة بالعميل والعقد من دون مغادرة الصفحة.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              تحديث
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="إجمالي الفواتير المعروضة"
          value={formatNumber(filteredInvoices.length)}
          hint={`${formatCurrency(metrics.totalAmount)} قيمة الفواتير`}
          icon={FileText}
        />
        <MetricCard
          title="تم تحصيله"
          value={formatCurrency(metrics.collectedAmount)}
          hint={`نسبة التحصيل ${metrics.collectionRate}%`}
          icon={CheckCircle2}
        />
        <MetricCard
          title="متبقي للتحصيل"
          value={formatCurrency(metrics.remainingAmount)}
          hint={`${formatNumber(metrics.unpaidCount)} فاتورة تحتاج متابعة`}
          icon={CircleDollarSign}
        />
        <MetricCard
          title="تعرض متأخر"
          value={formatCurrency(metrics.overdueAmount)}
          hint={`${formatNumber(metrics.overdueCount)} فاتورة متأخرة`}
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <Tabs value={statusTab} onValueChange={setStatusTab}>
              <TabsList className="h-auto flex-wrap">
                {STATUS_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] xl:min-w-[540px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث برقم الفاتورة، العميل، أو العقد"
                  className="pr-10"
                />
              </div>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">كل طرق الدفع</SelectItem>
                  {Object.entries(PAYMENT_METHOD_AR).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <Empty>
              <EmptyMedia variant="icon">
                <AlertTriangle />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل الفواتير</EmptyTitle>
                <EmptyDescription>حاول تحديث الصفحة أو إعادة المحاولة.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : filteredInvoices.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>لا توجد فواتير مطابقة</EmptyTitle>
                <EmptyDescription>غيّر البحث أو الفلاتر لعرض بيانات أكثر.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفاتورة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>العقد</TableHead>
                    <TableHead>التحصيل</TableHead>
                    <TableHead>المخاطرة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر موعد</TableHead>
                    <TableHead className="text-left">عرض</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const paid = getPaidAmount(invoice);
                    const remaining = getRemainingAmount(invoice);

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold">{invoice.invoiceNumber}</span>
                            <span className="text-xs text-muted-foreground">
                              {PAYMENT_METHOD_AR[invoice.paymentMethod] || invoice.paymentMethod}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{invoice.client?.companyName || "—"}</span>
                            <span className="text-xs text-muted-foreground">
                              {invoice.client?.name || invoice.client?.email || "بدون جهة اتصال"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {invoice.contract?.title || "بدون عقد مرتبط"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{formatCurrency(paid)}</span>
                            <span className="text-xs text-muted-foreground">
                              متبقي {formatCurrency(remaining)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RiskBadge invoice={invoice} />
                        </TableCell>
                        <TableCell>
                          <InvoiceStatusPill status={invoice.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(invoice.dueDate)}
                        </TableCell>
                        <TableCell className="text-left">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoiceId(invoice.id)}
                          >
                            عرض
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={!!selectedInvoiceId} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
        <DrawerContent>
          <DrawerHeader className="border-b pb-4 text-right">
            <DrawerTitle>
              {selectedInvoice?.invoiceNumber || "تفاصيل الفاتورة"}
            </DrawerTitle>
            <DrawerDescription>
              عرض سريع للتحصيل، العميل، وربط الفاتورة بالعقد والمدفوعات.
            </DrawerDescription>
          </DrawerHeader>

          {!selectedInvoice || isInvoiceDetailLoading ? (
            <div className="flex flex-col gap-4 p-6">
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-52 rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
            </div>
          ) : (
            <div className="flex flex-col gap-6 overflow-y-auto p-6">
              <Card>
                <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">إجمالي الفاتورة</p>
                    <p className="text-xl font-semibold">{formatCurrency(selectedInvoice.amount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">تم تحصيله</p>
                    <p className="text-xl font-semibold text-emerald-700">
                      {formatCurrency(getPaidAmount(selectedInvoice))}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">المتبقي</p>
                    <p className="text-xl font-semibold text-amber-700">
                      {formatCurrency(getRemainingAmount(selectedInvoice))}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="gap-2">
                    <CardTitle className="text-lg">معلومات المتابعة</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {[
                      ["الحالة", INVOICE_STATUS_AR[selectedInvoice.status] || selectedInvoice.status],
                      ["مخاطرة التحصيل", getInvoiceRisk(selectedInvoice).label],
                      ["تاريخ الإصدار", formatDateTime(selectedInvoice.issueDate)],
                      ["تاريخ الاستحقاق", formatDateTime(selectedInvoice.dueDate)],
                      ["أُرسلت في", formatDateTime(selectedInvoice.sentAt)],
                      ["تم السداد في", formatDateTime(selectedInvoice.paidAt)],
                      ["المرجع", selectedInvoice.paymentReference || "—"],
                      [
                        "طريقة الدفع",
                        PAYMENT_METHOD_AR[selectedInvoice.paymentMethod] ||
                          selectedInvoice.paymentMethod,
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="mt-2 text-sm font-medium">{value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="gap-2">
                    <CardTitle className="text-lg">العميل والعقد</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">العميل</p>
                      <p className="mt-2 font-medium">
                        {selectedInvoice.client?.companyName || "—"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedInvoice.client?.email || selectedInvoice.client?.phone || "بدون بيانات إضافية"}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">العقد المرتبط</p>
                      <p className="mt-2 font-medium">
                        {selectedInvoice.contract?.title || "بدون عقد مرتبط"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedInvoice.contract?.status || "—"}
                      </p>
                    </div>
                    {selectedInvoice.notes ? (
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">ملاحظات</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {selectedInvoice.notes}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="gap-2">
                  <CardTitle className="text-lg">سجل المدفوعات</CardTitle>
                  <CardDescription>
                    يساعدك هذا السجل على معرفة ما إذا كانت الفاتورة تحتاج تذكير أو متابعة مباشرة.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedInvoice.payments?.length ? (
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>العملية</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>الطريقة</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedInvoice.payments.map((payment: any) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-mono text-xs">
                                {String(payment.id).slice(0, 8)}
                              </TableCell>
                              <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                              <TableCell>
                                {PAYMENT_METHOD_AR[payment.method] || payment.method}
                              </TableCell>
                              <TableCell>
                                <Badge variant={payment.status === "SUCCESS" ? "secondary" : "outline"}>
                                  {payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDateTime(payment.date)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <Empty>
                      <EmptyMedia variant="icon">
                        <CreditCard />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>لا توجد مدفوعات بعد</EmptyTitle>
                        <EmptyDescription>هذه الفاتورة ما زالت تحتاج متابعة تحصيل.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DrawerFooter className="border-t pt-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={!selectedInvoice || isSendingInvoice}
                  onClick={() => selectedInvoice && handleSendInvoice(selectedInvoice.id)}
                >
                  {isSendingInvoice ? <Loader2 className="animate-spin" /> : <Mail />}
                  إعادة الإرسال
                </Button>
                <Button
                  variant="outline"
                  disabled={!selectedInvoice || isSendingReminder}
                  onClick={() => selectedInvoice && handleSendReminder(selectedInvoice.id)}
                >
                  {isSendingReminder ? <Loader2 className="animate-spin" /> : <BellRing />}
                  إرسال تذكير
                </Button>
              </div>
              {selectedInvoice ? (
                <Button asChild>
                  <Link href={`/dashboard/finance/invoices/${selectedInvoice.id}`}>
                    <ArrowUpRight />
                    فتح الصفحة الكاملة
                  </Link>
                </Button>
              ) : null}
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
