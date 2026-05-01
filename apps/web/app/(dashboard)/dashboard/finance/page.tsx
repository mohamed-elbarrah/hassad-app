"use client";

import { 
  useGetFinanceSummaryQuery, 
  useGetCashFlowQuery, 
  useGetFinanceAlertsQuery, 
  useGetPaymentsQuery,
  useGetInvoicesQuery,
  useGetEmployeesQuery
} from "@/features/finance/financeApi";
import { KPIStatCard } from "@/components/dashboard/finance/KPIStatCard";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
} from "recharts";
import { 
  DollarSign, 
  FileText, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  Calendar,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function FinanceDashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useGetFinanceSummaryQuery();
  const { data: cashFlow, isLoading: loadingCashFlow } = useGetCashFlowQuery();
  const { data: alerts, isLoading: loadingAlerts } = useGetFinanceAlertsQuery();
  const { data: paymentsData, isLoading: loadingPayments } = useGetPaymentsQuery({ limit: 5 });
  const { data: invoicesData } = useGetInvoicesQuery({ limit: 1 });
  const { data: employeesData } = useGetEmployeesQuery();

  const isLoading = loadingSummary || loadingCashFlow || loadingAlerts || loadingPayments;

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const payments = paymentsData?.items || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم المالية</h1>
        <p className="text-muted-foreground">نظرة عامة على الإيرادات والمصروفات والتدفق النقدي.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPIStatCard
          title="إجمالي الإيرادات"
          value={`${summary?.totalRevenue.toLocaleString()} ر.س`}
          icon={DollarSign}
          trend={{ value: "12%", isUp: true }}
        />
        <KPIStatCard
          title="فواتير مدفوعة"
          value={`${summary?.totalRevenue.toLocaleString()} ر.س`}
          icon={TrendingUp}
          className="bg-emerald-50/50 dark:bg-emerald-500/5"
        />
        <KPIStatCard
          title="فواتير معلقة"
          value={`${summary?.pendingInvoices.toLocaleString()} ر.س`}
          icon={Clock}
          className="bg-amber-50/50 dark:bg-amber-500/5"
        />
        <KPIStatCard
          title="مدفوعات فاشلة"
          value={`${summary?.failedPayments.toLocaleString()} ر.س`}
          icon={AlertTriangle}
          className="bg-rose-50/50 dark:bg-rose-500/5"
        />
        <KPIStatCard
          title="أرباح الشهر"
          value={`${summary?.monthlyProfit.toLocaleString()} ر.س`}
          icon={ArrowUpRight}
        />
        <KPIStatCard
          title="إجمالي المصروفات"
          value={`70,000 ر.س`}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-4 border-none shadow-md">
          <CardHeader>
            <CardTitle>التدفق النقدي</CardTitle>
            <CardDescription>مقارنة الدخل والمصروفات على مدار الأشهر الماضية</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value.toLocaleString()} ر.س`]}
                />
                <Legend verticalAlign="top" height={36}/>
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name="الدخل"
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  name="المصروفات"
                  stroke="#f43f5e" 
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts Section */}
        <Card className="lg:col-span-3 border-none shadow-md overflow-hidden">
          <CardHeader className="bg-rose-50/50 dark:bg-rose-500/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-rose-600 dark:text-rose-400">تنبيهات مالية</CardTitle>
                <CardDescription>مشكلات تتطلب تدخلًا فوريًا</CardDescription>
              </div>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-muted/50">
              {alerts?.map((alert) => (
                <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      alert.severity === "HIGH" ? "bg-rose-500 animate-pulse" : 
                      alert.severity === "MEDIUM" ? "bg-amber-500" : "bg-blue-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium">{alert.client}</p>
                      <p className="text-xs text-muted-foreground">{alert.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-600">{alert.amount.toLocaleString()} ر.س</p>
                    <Link href={`/dashboard/finance/invoices/${alert.id}`}>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">عرض التفاصيل</Button>
                    </Link>
                  </div>
                </div>
              ))}
              {alerts?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">لا توجد تنبيهات حالياً.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>أحدث العمليات</CardTitle>
              <CardDescription>آخر المدفوعات والتحويلات المسجلة</CardDescription>
            </div>
            <Link href="/dashboard/finance/payments">
              <Button variant="outline" size="sm">عرض الكل</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العميل</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.invoice.client?.companyName || 'عميل غير معروف'}</TableCell>
                    <TableCell>{payment.amount.toLocaleString()} ر.س</TableCell>
                    <TableCell>
                      <FinanceStatusBadge status={payment.status as any} />
                    </TableCell>
                    <TableCell className="text-left text-muted-foreground text-xs">{new Date(payment.date).toLocaleDateString('ar-SA')}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد عمليات مسجلة.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Links / Navigation */}
        <div className="grid gap-4 grid-cols-2">
          <QuickLinkCard 
            title="إدارة الفواتير" 
            href="/dashboard/finance/invoices" 
            icon={FileText} 
            count={invoicesData?.total} 
            description="إصدار ومتابعة الفواتير"
          />
          <QuickLinkCard 
            title="الرواتب والعمليات" 
            href="/dashboard/finance/payroll" 
            icon={Wallet} 
            count={employeesData?.length} 
            description="صرف الرواتب والمستحقات"
          />
          <QuickLinkCard 
            title="سجل العمليات" 
            href="/dashboard/finance/ledger" 
            icon={Calendar} 
            description="مراجعة التدقيق المالي"
          />
          <QuickLinkCard 
            title="العملاء" 
            href="/dashboard/finance/contracts" 
            icon={TrendingUp} 
            description="الوضع المالي للعقود"
          />
        </div>
      </div>
    </div>
  );
}

function QuickLinkCard({ title, href, icon: Icon, count, description }: { title: string, href: string, icon: any, count?: number, description: string }) {
  return (
    <Link href={href}>
      <Card className="h-full border-none shadow-sm hover:shadow-md transition-all group cursor-pointer bg-white dark:bg-slate-900">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg flex items-center justify-center gap-2">
              {title}
              {count !== undefined && <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{count}</span>}
            </h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
