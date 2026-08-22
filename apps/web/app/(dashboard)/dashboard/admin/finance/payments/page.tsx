"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Search,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import {
  PAYMENT_METHOD_AR,
  PaymentMethod,
  PaymentStatus,
} from "@hassad/shared";
import {
  useGetInvoiceByIdQuery,
  useGetPaymentsQuery,
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
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

const PAYMENT_STATUS_AR: Record<string, string> = {
  SUCCESS: "ناجحة",
  FAILED: "فاشلة",
  REFUNDED: "مسترجعة",
  PENDING: "معلقة",
};

const PAYMENT_STATUS_VARIANT: Record<string, "secondary" | "outline" | "destructive"> = {
  SUCCESS: "secondary",
  PENDING: "outline",
  FAILED: "destructive",
  REFUNDED: "destructive",
};

const PAYMENT_TABS = [
  { value: "ALL", label: "الكل" },
  { value: PaymentStatus.SUCCESS, label: "ناجحة" },
  { value: PaymentStatus.PENDING, label: "معلقة" },
  { value: PaymentStatus.FAILED, label: "فاشلة" },
  { value: PaymentStatus.REFUNDED, label: "مسترجعة" },
];

function getMethodIcon(method: string) {
  if ([PaymentMethod.APPLE_PAY, PaymentMethod.MADA, PaymentMethod.VISA_MC, PaymentMethod.CARD].includes(method as PaymentMethod)) {
    return CreditCard;
  }
  if (method === PaymentMethod.BANK_TRANSFER) {
    return Landmark;
  }
  return Banknote;
}

function PaymentMetricCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Wallet;
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

function PaymentsPageLoading() {
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

export default function AdminFinancePaymentsPage() {
  const [statusTab, setStatusTab] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetPaymentsQuery({
    limit: 100,
    status: statusTab === "ALL" ? undefined : statusTab,
  });

  const payments = useMemo(() => data?.items ?? [], [data?.items]);
  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        [
          payment.id,
          payment.providerPaymentId,
          payment.invoice?.invoiceNumber,
          payment.invoice?.client?.companyName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesMethod =
        methodFilter === "ALL" || payment.method === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [methodFilter, payments, search]);

  const selectedPayment = filteredPayments.find((item) => item.id === selectedPaymentId)
    || payments.find((item) => item.id === selectedPaymentId)
    || null;

  const {
    data: linkedInvoice,
    isFetching: isInvoiceLoading,
  } = useGetInvoiceByIdQuery(selectedPayment?.invoiceId || "", {
    skip: !selectedPayment?.invoiceId,
  });

  const metrics = useMemo(() => {
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const successful = filteredPayments.filter((payment) => payment.status === PaymentStatus.SUCCESS);
    const failed = filteredPayments.filter((payment) => payment.status === PaymentStatus.FAILED);
    const refunded = filteredPayments.filter((payment) => payment.status === PaymentStatus.REFUNDED);
    const pending = filteredPayments.filter((payment) => payment.status === PaymentStatus.PENDING);

    return {
      totalAmount,
      successfulAmount: successful.reduce((sum, payment) => sum + payment.amount, 0),
      pendingAmount: pending.reduce((sum, payment) => sum + payment.amount, 0),
      failedCount: failed.length,
      refundedCount: refunded.length,
      successRate:
        filteredPayments.length > 0
          ? Math.round((successful.length / filteredPayments.length) * 100)
          : 0,
    };
  }, [filteredPayments]);

  const relatedPayments = linkedInvoice?.payments || [];
  const successfulRelatedPayments = relatedPayments.filter((payment: any) => payment.status === PaymentStatus.SUCCESS);
  const linkedInvoicePaid = successfulRelatedPayments.reduce(
    (sum: number, payment: any) => sum + (payment.amount || 0),
    0,
  );
  const linkedInvoiceRemaining = linkedInvoice
    ? Math.max(0, linkedInvoice.amount - linkedInvoicePaid)
    : 0;

  if (isLoading) return <PaymentsPageLoading />;

  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">عمليات الدفع</CardTitle>
              <CardDescription>
                شاشة متابعة للمصالحة وربط كل عملية بالفاتورة والعميل وسياق التحصيل.
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            تحديث
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PaymentMetricCard
          title="القيمة المعروضة"
          value={formatCurrency(metrics.totalAmount)}
          hint={`${formatNumber(filteredPayments.length)} عملية`}
          icon={CircleDollarSign}
        />
        <PaymentMetricCard
          title="المحصل بنجاح"
          value={formatCurrency(metrics.successfulAmount)}
          hint={`نسبة النجاح ${metrics.successRate}%`}
          icon={CheckCircle2}
        />
        <PaymentMetricCard
          title="معلّق"
          value={formatCurrency(metrics.pendingAmount)}
          hint="مدفوعات تحتاج تأكيد أو متابعة"
          icon={ShieldAlert}
        />
        <PaymentMetricCard
          title="فاشل / مسترجع"
          value={formatNumber(metrics.failedCount + metrics.refundedCount)}
          hint="إشارات تحتاج مراجعة سريعة"
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <Tabs value={statusTab} onValueChange={setStatusTab}>
              <TabsList className="h-auto flex-wrap">
                {PAYMENT_TABS.map((tab) => (
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
                  placeholder="ابحث برقم العملية أو الفاتورة أو العميل"
                  className="pr-10"
                />
              </div>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">كل الطرق</SelectItem>
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
                <EmptyTitle>تعذر تحميل المدفوعات</EmptyTitle>
                <EmptyDescription>حاول إعادة التحديث أو راجع اتصال الواجهة البرمجية.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : filteredPayments.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Wallet />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>لا توجد عمليات مطابقة</EmptyTitle>
                <EmptyDescription>غيّر الفلاتر أو البحث لعرض نتائج أكثر.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العملية</TableHead>
                    <TableHead>الفاتورة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الطريقة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead className="text-left">عرض</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const MethodIcon = getMethodIcon(payment.method);

                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs">{payment.id.slice(0, 8)}</span>
                            <span className="text-xs text-muted-foreground">
                              {payment.providerPaymentId || "بدون مرجع مزود"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.invoice?.invoiceNumber || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{payment.invoice?.client?.companyName || "—"}</span>
                            <span className="text-xs text-muted-foreground">
                              {payment.invoice?.client?.name || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MethodIcon className="text-muted-foreground" />
                            <span className="text-sm">
                              {PAYMENT_METHOD_AR[payment.method] || payment.method}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={PAYMENT_STATUS_VARIANT[payment.status] || "outline"}>
                            {PAYMENT_STATUS_AR[payment.status] || payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(payment.date)}
                        </TableCell>
                        <TableCell className="text-left">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPaymentId(payment.id)}
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

      <Drawer open={!!selectedPaymentId} onOpenChange={(open) => !open && setSelectedPaymentId(null)}>
        <DrawerContent>
          <DrawerHeader className="border-b pb-4 text-right">
            <DrawerTitle>
              {selectedPayment ? `عملية ${selectedPayment.id.slice(0, 8)}` : "تفاصيل العملية"}
            </DrawerTitle>
            <DrawerDescription>
              تفاصيل المصالحة وربط العملية بالفاتورة المرتبطة بها.
            </DrawerDescription>
          </DrawerHeader>

          {!selectedPayment ? (
            <div className="p-6">
              <Empty>
                <EmptyMedia variant="icon">
                  <Wallet />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>اختر عملية للدخول في التفاصيل</EmptyTitle>
                  <EmptyDescription>سيظهر هنا سياق الفاتورة والتحصيل بمجرد اختيار العملية.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="flex flex-col gap-6 overflow-y-auto p-6">
              <Card>
                <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">قيمة العملية</p>
                    <p className="text-xl font-semibold">
                      {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">الحالة</p>
                    <Badge variant={PAYMENT_STATUS_VARIANT[selectedPayment.status] || "outline"}>
                      {PAYMENT_STATUS_AR[selectedPayment.status] || selectedPayment.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">تاريخ العملية</p>
                    <p className="text-xl font-semibold">{formatDateTime(selectedPayment.date)}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="gap-2">
                    <CardTitle className="text-lg">بيانات العملية</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {[
                      ["معرّف العملية", selectedPayment.id],
                      ["مرجع المزود", selectedPayment.providerPaymentId || "—"],
                      ["العملة", selectedPayment.currency],
                      ["طريقة الدفع", PAYMENT_METHOD_AR[selectedPayment.method] || selectedPayment.method],
                      ["تاريخ الإنشاء", formatDateTime(selectedPayment.createdAt)],
                      ["آخر تحديث", formatDateTime(selectedPayment.updatedAt)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="mt-2 text-sm font-medium break-all">{value}</p>
                      </div>
                    ))}
                    {selectedPayment.notes ? (
                      <div className="rounded-lg border p-4 md:col-span-2">
                        <p className="text-sm text-muted-foreground">ملاحظات</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{selectedPayment.notes}</p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="gap-2">
                    <CardTitle className="text-lg">سياق الفاتورة</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">الفاتورة المرتبطة</p>
                      <p className="mt-2 font-medium">
                        {selectedPayment.invoice?.invoiceNumber || linkedInvoice?.invoiceNumber || "—"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedPayment.invoice?.client?.companyName || linkedInvoice?.client?.companyName || "—"}
                      </p>
                    </div>
                    {isInvoiceLoading ? (
                      <Skeleton className="h-32 rounded-lg" />
                    ) : linkedInvoice ? (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-lg border p-4">
                            <p className="text-sm text-muted-foreground">إجمالي الفاتورة</p>
                            <p className="mt-2 font-medium">{formatCurrency(linkedInvoice.amount)}</p>
                          </div>
                          <div className="rounded-lg border p-4">
                            <p className="text-sm text-muted-foreground">المتبقي بعد هذه العملية</p>
                            <p className="mt-2 font-medium">{formatCurrency(linkedInvoiceRemaining)}</p>
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <p className="text-sm text-muted-foreground">حالة الفاتورة الآن</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{linkedInvoice.status}</Badge>
                            <span className="text-sm text-muted-foreground">
                              الاستحقاق {formatDateTime(linkedInvoice.dueDate)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                        لا توجد تفاصيل إضافية للفواتير المرتبطة.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {linkedInvoice?.payments?.length ? (
                <Card>
                  <CardHeader className="gap-2">
                    <CardTitle className="text-lg">كل عمليات الفاتورة</CardTitle>
                    <CardDescription>
                      يساعد هذا السجل على معرفة ما إذا كانت العملية جزءاً من دفعات متعددة أم محاولة منفردة.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                          {linkedInvoice.payments.map((payment: any) => (
                            <TableRow
                              key={payment.id}
                              data-state={payment.id === selectedPayment.id ? "selected" : undefined}
                            >
                              <TableCell className="font-mono text-xs">
                                {String(payment.id).slice(0, 8)}
                              </TableCell>
                              <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                              <TableCell>
                                {PAYMENT_METHOD_AR[payment.method] || payment.method}
                              </TableCell>
                              <TableCell>
                                <Badge variant={PAYMENT_STATUS_VARIANT[payment.status] || "outline"}>
                                  {PAYMENT_STATUS_AR[payment.status] || payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDateTime(payment.date)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}

          <DrawerFooter className="border-t pt-4">
            {selectedPayment?.invoiceId ? (
              <div className="flex w-full justify-end">
                <Button asChild>
                  <Link href={`/dashboard/admin/finance/invoices/${selectedPayment.invoiceId}`}>
                    <ArrowUpRight />
                    فتح الفاتورة الكاملة
                  </Link>
                </Button>
              </div>
            ) : null}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
