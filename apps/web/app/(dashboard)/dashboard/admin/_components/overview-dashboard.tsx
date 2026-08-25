"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Download,
  RefreshCw,
  Users,
  DollarSign,
  ReceiptText,
  BadgeCheck,
  TrendingUp,
  CircleDollarSign,
  Target,
  Activity,
  AlertTriangle,
  MoreHorizontal,
  CheckCheck,
  Building2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type PeriodKey = "7d" | "30d" | "90d";

type RevenuePoint = {
  label: string;
  current: number;
  previous: number;
};

type CollectionSlice = {
  key: "paid" | "unpaid" | "overdue";
  label: string;
  value: number;
  amount: number;
};

type FunnelStage = {
  key: string;
  label: string;
  value: number;
  rate: number;
};

type TeamMember = {
  name: string;
  role: string;
  tasks: number;
  completed: number;
  overdue: number;
  revenue: number;
};

type AlertItem = {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
};

type ActivityItem = {
  title: string;
  detail: string;
  time: string;
  tone: "success" | "warning" | "default";
};

type InvoiceRow = {
  number: string;
  client: string;
  amount: number;
  dueIn: string;
  status: "paid" | "unpaid" | "late";
};

type OverviewData = {
  label: string;
  subtitle: string;
  revenue: number;
  revenueDelta: number;
  collectionRate: number;
  collectionDelta: number;
  conversionRate: number;
  conversionDelta: number;
  paidAmount: number;
  paidDelta: number;
  unpaidAmount: number;
  unpaidDelta: number;
  leads: number;
  leadsDelta: number;
  activeTeam: number;
  teamDelta: number;
  revenuePoints: RevenuePoint[];
  collections: CollectionSlice[];
  funnel: FunnelStage[];
  team: TeamMember[];
  alerts: AlertItem[];
  activity: ActivityItem[];
  invoices: InvoiceRow[];
};

const PERIODS: Record<PeriodKey, OverviewData> = {
  "7d": {
    label: "آخر 7 أيام",
    subtitle: "مقارنة بالأسبوع السابق",
    revenue: 128400,
    revenueDelta: 16.4,
    collectionRate: 78,
    collectionDelta: 5.2,
    conversionRate: 28.3,
    conversionDelta: 2.8,
    paidAmount: 100200,
    paidDelta: 14.1,
    unpaidAmount: 28200,
    unpaidDelta: -9.6,
    leads: 486,
    leadsDelta: 11.4,
    activeTeam: 37,
    teamDelta: 4.8,
    revenuePoints: [
      { label: "السبت", current: 16800, previous: 13200 },
      { label: "الأحد", current: 15400, previous: 12800 },
      { label: "الإثنين", current: 21000, previous: 16400 },
      { label: "الثلاثاء", current: 17800, previous: 14600 },
      { label: "الأربعاء", current: 19600, previous: 14900 },
      { label: "الخميس", current: 22500, previous: 17600 },
      { label: "الجمعة", current: 15300, previous: 12100 },
    ],
    collections: [
      { key: "paid", label: "مدفوع", value: 78, amount: 100200 },
      { key: "unpaid", label: "غير مدفوع", value: 17, amount: 21800 },
      { key: "overdue", label: "متأخر", value: 5, amount: 6400 },
    ],
    funnel: [
      { key: "leads", label: "العملاء المحتملون", value: 486, rate: 100 },
      { key: "qualified", label: "العملاء المؤهلون", value: 291, rate: 60 },
      { key: "proposals", label: "العروض المرسلة", value: 148, rate: 51 },
      { key: "won", label: "الصفقات الرابحة", value: 92, rate: 62 },
      { key: "paid", label: "المدفوعات", value: 72, rate: 78 },
    ],
    team: [
      {
        name: "Maha",
        role: "قائد المبيعات",
        tasks: 18,
        completed: 15,
        overdue: 1,
        revenue: 25600,
      },
      {
        name: "Omar",
        role: "مدير الحسابات",
        tasks: 16,
        completed: 14,
        overdue: 0,
        revenue: 21400,
      },
      {
        name: "Sara",
        role: "نجاح العملاء",
        tasks: 13,
        completed: 10,
        overdue: 2,
        revenue: 18200,
      },
      {
        name: "Yousef",
        role: "العمليات",
        tasks: 11,
        completed: 9,
        overdue: 1,
        revenue: 12900,
      },
    ],
    alerts: [
      {
        title: "8 فواتير متأخرة",
        detail: "إجمالي 6,400 ر.س يحتاج متابعة اليوم",
        severity: "high",
      },
      {
        title: "3 صفقات متوقفة",
        detail: "لم تتحرك منذ أكثر من 10 أيام",
        severity: "medium",
      },
      {
        title: "تراجع تحويل الزيارات",
        detail: "أقل من الهدف بـ 4% هذا الأسبوع",
        severity: "low",
      },
    ],
    activity: [
      {
        title: "فاتورة مدفوعة",
        detail: "Al Noor Clinic سددت 12,400 ر.س",
        time: "قبل 12 دقيقة",
        tone: "success",
      },
      {
        title: "صفقة انتقلت للمرحلة النهائية",
        detail: "خطة المؤسسات - تم إرسال الموافقة",
        time: "قبل 34 دقيقة",
        tone: "default",
      },
      {
        title: "مهمة متأخرة",
        detail: "مراجعة العقد مع الفريق أ",
        time: "قبل 1 ساعة",
        tone: "warning",
      },
      {
        title: "عميل جديد",
        detail: "وصلت 6 فرص جديدة من الحملة",
        time: "قبل 2 ساعة",
        tone: "success",
      },
    ],
    invoices: [
      {
        number: "INV-2048",
        client: "Al Noor Clinic",
        amount: 12400,
        dueIn: "مدفوع",
        status: "paid",
      },
      {
        number: "INV-2051",
        client: "Atlas Group",
        amount: 9800,
        dueIn: "2 أيام",
        status: "unpaid",
      },
      {
        number: "INV-2054",
        client: "Blue Peak",
        amount: 6400,
        dueIn: "متأخر 4 أيام",
        status: "late",
      },
      {
        number: "INV-2057",
        client: "Nexus Studio",
        amount: 7600,
        dueIn: "5 أيام",
        status: "unpaid",
      },
    ],
  },
  "30d": {
    label: "آخر 30 يومًا",
    subtitle: "مقارنة بالشهر السابق",
    revenue: 482300,
    revenueDelta: 12.7,
    collectionRate: 74,
    collectionDelta: 4.1,
    conversionRate: 24.8,
    conversionDelta: 1.9,
    paidAmount: 357600,
    paidDelta: 11.2,
    unpaidAmount: 124700,
    unpaidDelta: -6.3,
    leads: 1820,
    leadsDelta: 9.5,
    activeTeam: 39,
    teamDelta: 3.9,
    revenuePoints: [
      { label: "الأسبوع 1", current: 102000, previous: 88000 },
      { label: "الأسبوع 2", current: 112400, previous: 96500 },
      { label: "الأسبوع 3", current: 124700, previous: 108000 },
      { label: "الأسبوع 4", current: 143200, previous: 119500 },
    ],
    collections: [
      { key: "paid", label: "مدفوع", value: 74, amount: 357600 },
      { key: "unpaid", label: "غير مدفوع", value: 21, amount: 101200 },
      { key: "overdue", label: "متأخر", value: 5, amount: 24100 },
    ],
    funnel: [
      { key: "leads", label: "العملاء المحتملون", value: 1820, rate: 100 },
      { key: "qualified", label: "العملاء المؤهلون", value: 1024, rate: 56 },
      { key: "proposals", label: "العروض المرسلة", value: 520, rate: 51 },
      { key: "won", label: "الصفقات الرابحة", value: 254, rate: 49 },
      { key: "paid", label: "المدفوعات", value: 188, rate: 74 },
    ],
    team: [
      {
        name: "Maha",
        role: "قائد المبيعات",
        tasks: 68,
        completed: 57,
        overdue: 3,
        revenue: 98200,
      },
      {
        name: "Omar",
        role: "مدير الحسابات",
        tasks: 55,
        completed: 48,
        overdue: 1,
        revenue: 80100,
      },
      {
        name: "Sara",
        role: "نجاح العملاء",
        tasks: 49,
        completed: 39,
        overdue: 4,
        revenue: 74200,
      },
      {
        name: "Yousef",
        role: "العمليات",
        tasks: 41,
        completed: 35,
        overdue: 2,
        revenue: 54200,
      },
    ],
    alerts: [
      {
        title: "24 فاتورة تحتاج متابعة",
        detail: "المبالغ المفتوحة بلغت 124,700 ر.س",
        severity: "high",
      },
      {
        title: "12 صفقة تحتاج تدخل",
        detail: "لا يوجد رد من العميل منذ 7 أيام",
        severity: "medium",
      },
      {
        title: "مراجعة أداء الفريق",
        detail: "خمس مهام تجاوزت SLA هذا الأسبوع",
        severity: "low",
      },
    ],
    activity: [
      {
        title: "دفعة ناجحة",
        detail: "تم تحصيل 38,000 ر.س من عميل Enterprise",
        time: "قبل 18 دقيقة",
        tone: "success",
      },
      {
        title: "تحديث مرحلة",
        detail: "3 صفقات انتقلت إلى مرحلة الإغلاق",
        time: "قبل 1 ساعة",
        tone: "default",
      },
      {
        title: "تأخر في التحصيل",
        detail: "فاتورتان تجاوزتا تاريخ الاستحقاق",
        time: "قبل 3 ساعات",
        tone: "warning",
      },
      {
        title: "جلسة فريق",
        detail: "تم إغلاق 14 مهمة اليوم",
        time: "قبل 5 ساعات",
        tone: "success",
      },
    ],
    invoices: [
      {
        number: "INV-1984",
        client: "Al Noor Clinic",
        amount: 34000,
        dueIn: "مدفوع",
        status: "paid",
      },
      {
        number: "INV-1991",
        client: "Atlas Group",
        amount: 18200,
        dueIn: "1 يوم",
        status: "unpaid",
      },
      {
        number: "INV-1997",
        client: "Blue Peak",
        amount: 15700,
        dueIn: "متأخر 2 يوم",
        status: "late",
      },
      {
        number: "INV-2002",
        client: "Nexus Studio",
        amount: 22100,
        dueIn: "4 أيام",
        status: "unpaid",
      },
    ],
  },
  "90d": {
    label: "آخر 90 يومًا",
    subtitle: "مقارنة بالربع السابق",
    revenue: 1357200,
    revenueDelta: 19.8,
    collectionRate: 71,
    collectionDelta: 6.6,
    conversionRate: 22.1,
    conversionDelta: 2.3,
    paidAmount: 962400,
    paidDelta: 18.2,
    unpaidAmount: 394800,
    unpaidDelta: -8.4,
    leads: 5420,
    leadsDelta: 14.8,
    activeTeam: 42,
    teamDelta: 5.4,
    revenuePoints: [
      { label: "شهر 1", current: 392000, previous: 321000 },
      { label: "شهر 2", current: 441000, previous: 369000 },
      { label: "شهر 3", current: 524200, previous: 421000 },
    ],
    collections: [
      { key: "paid", label: "مدفوع", value: 71, amount: 962400 },
      { key: "unpaid", label: "غير مدفوع", value: 23, amount: 312300 },
      { key: "overdue", label: "متأخر", value: 6, amount: 83000 },
    ],
    funnel: [
      { key: "leads", label: "العملاء المحتملون", value: 5420, rate: 100 },
      { key: "qualified", label: "العملاء المؤهلون", value: 2940, rate: 54 },
      { key: "proposals", label: "العروض المرسلة", value: 1330, rate: 45 },
      { key: "won", label: "الصفقات الرابحة", value: 618, rate: 46 },
      { key: "paid", label: "المدفوعات", value: 438, rate: 71 },
    ],
    team: [
      {
        name: "Maha",
        role: "قائد المبيعات",
        tasks: 183,
        completed: 156,
        overdue: 8,
        revenue: 274200,
      },
      {
        name: "Omar",
        role: "مدير الحسابات",
        tasks: 157,
        completed: 133,
        overdue: 4,
        revenue: 221700,
      },
      {
        name: "Sara",
        role: "نجاح العملاء",
        tasks: 142,
        completed: 121,
        overdue: 7,
        revenue: 198500,
      },
      {
        name: "Yousef",
        role: "العمليات",
        tasks: 109,
        completed: 97,
        overdue: 5,
        revenue: 143200,
      },
    ],
    alerts: [
      {
        title: "64 فاتورة غير محصلة",
        detail: "إجمالي المبالغ المفتوحة 394,800 ر.س",
        severity: "high",
      },
      {
        title: "18 صفقة تحتاج اهتمام",
        detail: "تأخر في الاستجابة أو التفاوض",
        severity: "medium",
      },
      {
        title: "تأثير التسويق",
        detail: "التحويل مستقر لكن بحاجة رفع متوسط الصفقة",
        severity: "low",
      },
    ],
    activity: [
      {
        title: "تحصيل كبير",
        detail: "تم إغلاق عقد بقيمة 96,000 ر.س",
        time: "قبل 1 ساعة",
        tone: "success",
      },
      {
        title: "صفقة جديدة",
        detail: "تمت إضافة 27 فرصة في الربع",
        time: "قبل 4 ساعات",
        tone: "default",
      },
      {
        title: "متابعة متأخرة",
        detail: "5 حالات تحتاج اتصال عاجل",
        time: "أمس",
        tone: "warning",
      },
      {
        title: "دفعة مكتملة",
        detail: "3 عملاء سددوا هذا اليوم",
        time: "أمس",
        tone: "success",
      },
    ],
    invoices: [
      {
        number: "INV-1772",
        client: "Al Noor Clinic",
        amount: 61200,
        dueIn: "مدفوع",
        status: "paid",
      },
      {
        number: "INV-1784",
        client: "Atlas Group",
        amount: 28900,
        dueIn: "3 أيام",
        status: "unpaid",
      },
      {
        number: "INV-1792",
        client: "Blue Peak",
        amount: 17400,
        dueIn: "متأخر 6 أيام",
        status: "late",
      },
      {
        number: "INV-1805",
        client: "Nexus Studio",
        amount: 33000,
        dueIn: "1 يوم",
        status: "unpaid",
      },
    ],
  },
};

const revenueConfig = {
  current: {
    label: "الفترة الحالية",
    color: "var(--chart-2)",
  },
  previous: {
    label: "الفترة السابقة",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const collectionConfig = {
  paid: { label: "مدفوع", color: "var(--chart-2)" },
  unpaid: { label: "غير مدفوع", color: "var(--chart-3)" },
  overdue: { label: "متأخر", color: "var(--destructive)" },
} satisfies ChartConfig;

const collectionColors: Record<CollectionSlice["key"], string> = {
  paid: "var(--chart-2)",
  unpaid: "var(--chart-3)",
  overdue: "var(--destructive)",
};

const funnelConfig = {
  value: { label: "المرحلة", color: "var(--chart-2)" },
} satisfies ChartConfig;

const funnelColors: Record<FunnelStage["key"], string> = {
  leads: "var(--chart-1)",
  qualified: "var(--chart-2)",
  proposals: "var(--chart-3)",
  won: "var(--chart-4)",
  paid: "var(--chart-5)",
};

const deltaTone = (delta: number) => {
  if (delta > 0) return "success";
  if (delta < 0) return "destructive";
  return "secondary";
};

function formatDelta(delta: number) {
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  return `${sign}${Math.abs(delta).toFixed(1)}%`;
}

function statusBadge(status: InvoiceRow["status"]) {
  switch (status) {
    case "paid":
      return <Badge variant="secondary">مدفوع</Badge>;
    case "late":
      return <Badge variant="destructive">متأخر</Badge>;
    default:
      return <Badge variant="outline">غير مدفوع</Badge>;
  }
}

export function OverviewDashboard() {
  const router = useRouter();
  const [period, setPeriod] = React.useState<PeriodKey>("30d");

  const data = PERIODS[period];

  const kpis = React.useMemo(
    () => [
      {
        key: "revenue",
        label: "الإيرادات",
        value: formatCurrency(data.revenue),
        delta: data.revenueDelta,
        helper: "مقارنة بالفترة السابقة",
        icon: DollarSign,
      },
      {
        key: "paid",
        label: "المدفوع",
        value: formatCurrency(data.paidAmount),
        delta: data.paidDelta,
        helper: "المبالغ المحصّلة",
        icon: ReceiptText,
      },
      {
        key: "unpaid",
        label: "غير المدفوع",
        value: formatCurrency(data.unpaidAmount),
        delta: data.unpaidDelta,
        helper: "المبالغ المفتوحة",
        icon: CircleDollarSign,
      },
      {
        key: "conversion",
        label: "معدل التحويل",
        value: `${data.conversionRate}%`,
        delta: data.conversionDelta,
        helper: "من العملاء المحتملين إلى المدفوعات",
        icon: Target,
      },
      {
        key: "collection",
        label: "معدل التحصيل",
        value: `${data.collectionRate}%`,
        delta: data.collectionDelta,
        helper: "المدفوع من الإجمالي",
        icon: BadgeCheck,
      },
      {
        key: "team",
        label: "فريق نشط",
        value: formatCompactNumber(data.activeTeam),
        delta: data.teamDelta,
        helper: "الموظفون النشطون اليوم",
        icon: Users,
      },
    ],
    [data],
  );

  const quickActions = [
    { label: "تقرير مالي", href: "/dashboard/admin/reports", icon: TrendingUp },
    { label: "إدارة العملاء", href: "/dashboard/admin/clients", icon: Users },
    { label: "المهام", href: "/dashboard/admin/tasks", icon: CheckCheck },
    {
      label: "الفواتير",
      href: "/dashboard/admin/finance/invoices",
      icon: ReceiptText,
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6   ">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">الرئيسية</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>نظرة عامة الإدارة</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    نظرة عامة
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {data.subtitle} — لوحة مختصرة لمتابعة الإيرادات والتحويل
                    والفريق.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as PeriodKey)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="اختر المدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">آخر 7 أيام</SelectItem>
                <SelectItem value="30d">آخر 30 يومًا</SelectItem>
                <SelectItem value="90d">آخر 90 يومًا</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.refresh()}
            >
              <RefreshCw data-icon="inline-start" />
              تحديث
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal data-icon="inline-start" />
                  إجراءات
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>إجراءات سريعة</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickActions.map((action) => (
                  <DropdownMenuItem
                    key={action.href}
                    onSelect={() => router.push(action.href)}
                  >
                    <action.icon data-icon="inline-start" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => router.push("/dashboard/admin/reports")}
                >
                  <Download data-icon="inline-start" />
                  تصدير التقرير
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" asChild>
              <Link href="/dashboard/admin/reports">
                <ArrowUpRight data-icon="inline-start" />
                عرض التقرير الكامل
              </Link>
            </Button>
          </div>
        </div>

        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as PeriodKey)}
        >
          <TabsList>
            <TabsTrigger value="7d">7 أيام</TabsTrigger>
            <TabsTrigger value="30d">30 يومًا</TabsTrigger>
            <TabsTrigger value="90d">90 يومًا</TabsTrigger>
          </TabsList>
        </Tabs>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {kpis.map((item) => (
            <Card key={item.key}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
                <div className="space-y-1">
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="text-2xl">{item.value}</CardTitle>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <item.icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      deltaTone(item.delta) === "destructive"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {formatDelta(item.delta)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.helper}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, Math.abs(item.delta) * 4)}
                  className="h-1.5"
                />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <Card>
            <CardHeader className="gap-2">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>مقارنة الإيرادات</CardTitle>
                  <CardDescription>
                    الإيرادات الحالية مقابل الفترة السابقة مع مقارنة واضحة.
                  </CardDescription>
                </div>
                <Badge variant="outline">{data.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={revenueConfig}
                className="h-[320px] w-full"
              >
                <AreaChart
                  data={data.revenuePoints}
                  margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) =>
                      formatCompactNumber(Number(value))
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="previous"
                    stroke="var(--color-previous)"
                    fill="var(--color-previous)"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="current"
                    stroke="var(--color-current)"
                    fill="var(--color-current)"
                    fillOpacity={0.2}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle>التحصيلات</CardTitle>
              <CardDescription>
                المدفوع وغير المدفوع والمتأخر في دائرة واحدة.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <ChartContainer
                config={collectionConfig}
                className="h-[240px] w-full"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel nameKey="key" />}
                  />
                  <Pie
                    data={data.collections}
                    dataKey="value"
                    nameKey="key"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {data.collections.map((slice) => (
                      <Cell
                        key={slice.key}
                        fill={collectionColors[slice.key]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <div className="grid gap-3">
                {data.collections.map((slice) => (
                  <div
                    key={slice.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: collectionColors[slice.key] }}
                      />
                      <span className="text-sm text-foreground">
                        {slice.label}
                      </span>
                    </div>
                    <div className="text-end">
                      <div className="text-sm font-medium">
                        {formatCurrency(slice.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {slice.value}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle>قمع التحويل</CardTitle>
              <CardDescription>
                أين يخرج العملاء من الرحلة وما المرحلة التي تحتاج دعمًا.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={funnelConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={data.funnel}
                  margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      formatCompactNumber(Number(value))
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    radius={[8, 8, 0, 0]}
                    fill="var(--chart-2)"
                  >
                    {data.funnel.map((stage) => (
                      <Cell key={stage.key} fill={funnelColors[stage.key]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {data.funnel.map((stage) => (
                  <div
                    key={stage.key}
                    className="rounded-lg border bg-muted/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium">{stage.label}</span>
                      <Badge
                        variant={
                          stage.rate >= 70
                            ? "secondary"
                            : stage.rate >= 50
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {stage.rate}%
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatCompactNumber(stage.value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle>نبض الأعمال</CardTitle>
              <CardDescription>
                إشارات سريعة تساعد المدير على اتخاذ القرار.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                {
                  label: "الإيرادات",
                  value: formatCurrency(data.revenue),
                  tone: "text-foreground",
                },
                {
                  label: "التحويل",
                  value: `${data.conversionRate}%`,
                  tone: "text-foreground",
                },
                {
                  label: "معدل التحصيل",
                  value: `${data.collectionRate}%`,
                  tone: "text-foreground",
                },
                {
                  label: "الفواتير المفتوحة",
                  value: formatCompactNumber(
                    data.invoices.filter((invoice) => invoice.status !== "paid")
                      .length,
                  ),
                  tone: "text-foreground",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <span className={cn("text-sm font-medium", item.tone)}>
                    {item.value}
                  </span>
                </div>
              ))}

              <Separator />

              <div className="grid gap-3">
                {data.alerts.map((alert) => (
                  <div
                    key={alert.title}
                    className="rounded-lg border bg-muted/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle
                            className={cn(
                              "size-4",
                              alert.severity === "high"
                                ? "text-destructive"
                                : alert.severity === "medium"
                                  ? "text-amber-500"
                                  : "text-primary",
                            )}
                          />
                          <span className="text-sm font-medium">
                            {alert.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {alert.detail}
                        </p>
                      </div>
                      <Badge
                        variant={
                          alert.severity === "high"
                            ? "destructive"
                            : alert.severity === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {alert.severity === "high"
                          ? "عاجل"
                          : alert.severity === "medium"
                            ? "مهم"
                            : "مراقبة"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle>أداء الفريق</CardTitle>
              <CardDescription>
                نظرة على إنتاجية الفريق والعبء الحالي لكل عضو.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العضو</TableHead>
                    <TableHead>المهام</TableHead>
                    <TableHead>المكتمل</TableHead>
                    <TableHead>المتأخر</TableHead>
                    <TableHead>الإيراد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.team.map((member) => {
                    const completion = Math.round(
                      (member.completed / member.tasks) * 100,
                    );
                    return (
                      <TableRow key={member.name}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{member.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {member.role}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.tasks}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{member.completed}</span>
                            <Progress value={completion} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.overdue > 0 ? (
                            <Badge variant="destructive">
                              {member.overdue}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(member.revenue)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle>النشاط الأخير</CardTitle>
              <CardDescription>
                آخر التحديثات التي يحتاج المدير رؤيتها فورًا.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data.activity.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-9 items-center justify-center rounded-full",
                      item.tone === "success"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : item.tone === "warning"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-primary/10 text-primary",
                    )}
                  >
                    <Activity className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle>الفواتير المعلّقة</CardTitle>
              <CardDescription>
                القائمة المختصرة للفواتير التي تحتاج متابعة أو تأكيد.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفاتورة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.invoices.map((invoice) => (
                    <TableRow key={invoice.number}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{invoice.number}</span>
                          <span className="text-xs text-muted-foreground">
                            {invoice.dueIn}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.client}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{statusBadge(invoice.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle>روابط سريعة</CardTitle>
              <CardDescription>
                وصول مباشر لأكثر الأماكن التي يحتاجها المدير.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Button
                  key={action.href}
                  variant="outline"
                  className="h-auto justify-start p-4"
                  asChild
                >
                  <Link href={action.href}>
                    <action.icon data-icon="inline-start" />
                    <span className="flex flex-col items-start gap-1">
                      <span>{action.label}</span>
                      <span className="text-xs text-muted-foreground">
                        افتح القسم مباشرة
                      </span>
                    </span>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </TooltipProvider>
  );
}
