"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Filter,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ActionButton } from "@/components/design-system/ActionButton";
import { AlertCard } from "@/components/design-system/AlertCard";
import { CountChip } from "@/components/design-system/CountChip";

import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { EmptyState } from "@/components/design-system/EmptyState";
import { FilterBar } from "@/components/design-system/FilterBar";
import { FormInput } from "@/components/design-system/FormInput";
import { FormTextarea } from "@/components/design-system/FormTextarea";
import { Input } from "@/components/design-system/Input";
import { MetricCard, KpiCurrency } from "@/components/design-system/MetricCard";
import { MetricSwitcher } from "@/components/design-system/MetricSwitcher";
import { PageIntro } from "@/components/design-system/PageIntro";
import { Pill } from "@/components/design-system/Pill";
import { PmCard } from "@/components/design-system/PmCard";
import { Popover } from "@/components/design-system/Popover";
import { ProgressBar } from "@/components/design-system/ProgressBar";

import { QuickLinkCard } from "@/components/design-system/QuickLinkCard";
import { Select, SelectItem } from "@/components/design-system/Select";
import { ShowcaseCard } from "@/components/design-system/ShowcaseCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/design-system/Tabs";
import { TimeRangeSelector } from "@/components/design-system/TimeRangeSelector";
import { UserAvatar } from "@/components/design-system/UserAvatar";

const tableColumns: DataTableColumn[] = [
  { id: "record", label: "السجل", align: "right" },
  { id: "owner", label: "المسؤول", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "value", label: "القيمة", align: "center" },
  { id: "next", label: "الخطوة التالية", align: "right" },
];

const tableEmptyState: DataTableEmptyState = {
  icon: BriefcaseBusiness,
  message: "لا توجد سجلات",
  hint: "عند إضافة سجلات جديدة ستظهر هنا بنفس شكل الجداول المعتمد.",
};

const records = [
  {
    id: "lead-1",
    name: "شركة النخيل للتجارة",
    meta: "Lead · مصدره حملة إعلانية",
    owner: "سارة",
    status: "IN_PROGRESS",
    value: "48,000 ر.س",
    next: "مكالمة متابعة اليوم",
  },
  {
    id: "project-1",
    name: "إطلاق متجر إلكتروني",
    meta: "Project · مرحلة التصميم",
    owner: "أحمد",
    status: "IN_REVIEW",
    value: "72%",
    next: "مراجعة العميل",
  },
  {
    id: "invoice-1",
    name: "فاتورة HSD-2048",
    meta: "Finance · عقد سنوي",
    owner: "نورة",
    status: "DUE",
    value: "12,500 ر.س",
    next: "تذكير دفع خلال 3 أيام",
  },
];

const flowCards = [
  {
    title: "Sales",
    description: "Lead -> Proposal -> Contract",
    icon: Target,
    tone: "blue" as const,
  },
  {
    title: "PM",
    description: "Project -> Tasks -> Review",
    icon: FolderKanban,
    tone: "purple" as const,
  },
  {
    title: "Finance",
    description: "Invoice -> Payment -> Ledger",
    icon: CircleDollarSign,
    tone: "success" as const,
  },
  {
    title: "Marketing",
    description: "Campaign -> Content -> Report",
    icon: Megaphone,
    tone: "warning" as const,
  },
];

const statusSamples = [
  "NEW",
  "IN_PROGRESS",
  "IN_REVIEW",
  "PENDING",
  "APPROVED",
  "OVERDUE",
  "PAID",
  "DRAFT",
];

export default function DesignSystemShowcasePage() {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  function handleFilterChange(groupKey: string, values: string[]) {
    setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
  }

  return (
    <main className="min-h-screen bg-portal-bg" dir="rtl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <PageIntro
          title="نظام تصميم المنتج"
          description="صفحة مرجعية لتوحيد الواجهات، المكونات، وأنماط عرض البيانات قبل استخدامها داخل صفحات Hassad."
          icon={LayoutDashboard}
          actions={
            <>
              <ActionButton
                href="/"
                variant="outline"
                icon={<ArrowUpRight className="h-4 w-4" />}
              >
                العودة للرئيسية
              </ActionButton>
              <ActionButton
                variant="primary"
                icon={<Sparkles className="h-4 w-4" />}
              >
                الإجراء الأساسي
              </ActionButton>
            </>
          }
        />

        <StatusBanner variant="info" title="قاعدة العمل">
          استخدم مكونات `@/components/design-system/*` في الصفحات، ولا تبن
          أنماطاً جديدة قبل إضافتها هنا.
        </StatusBanner>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="فرص نشطة"
            value="128"
            pillText="+12%"
            pillTone="success"
          />
          <MetricCard
            title="مشاريع قيد التنفيذ"
            value="34"
            pillText="7 عاجلة"
            pillTone="warning"
          />
          <MetricCard
            title="فواتير مستحقة"
            value="19"
            pillText="3 متأخرة"
            pillTone="danger"
          />
          <MetricCard
            title="معدل التسليم"
            value="91%"
            pillText="مستقر"
            pillTone="blue"
          />
        </section>

        <SurfaceCard
          title="لغة المنتج"
          description="هذه هي القواعد العملية التي تمنع الفوضى في تطبيق كبير متعدد الأدوار."
          icon={ShieldCheck}
        >
          <div className="grid gap-4 lg:grid-cols-4">
            {flowCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border-[1.5px] border-portal-card-border bg-portal-bg p-5"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-natural-0">
                      <Icon className="h-6 w-6 text-secondary-500" />
                    </div>
                    <Pill tone={item.tone}>{item.title}</Pill>
                  </div>
                  <p className="text-lg font-semibold text-natural-100">
                    {item.description}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-portal-note-text">
                    كل تدفق يجب أن يملك قائمة، صفحة تفاصيل، حالة واضحة، وخطوة
                    تالية.
                  </p>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="الأزرار والمدخلات"
          description="الإجراءات، البحث، الفلاتر، والحقول يجب أن تبقى بنفس الكثافة والارتفاع."
          icon={Filter}
        >
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <ActionButton
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                >
                  إضافة سجل
                </ActionButton>
                <ActionButton variant="outline">تصدير</ActionButton>
                <ActionButton variant="ghost">إلغاء</ActionButton>
                <ActionButton variant="action-blue">إرسال</ActionButton>
                <ActionButton variant="action-purple">مراجعة ذكية</ActionButton>
                <ActionButton variant="pm">إسناد للمدير</ActionButton>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  icon={<Search className="h-4 w-4" />}
                  size="lg"
                  placeholder="ابحث عن عميل، مشروع، أو فاتورة"
                />
                <Select defaultValue="all" label="الفريق">
                  <SelectItem value="all">كل الفرق</SelectItem>
                  <SelectItem value="sales">المبيعات</SelectItem>
                  <SelectItem value="pm">إدارة المشاريع</SelectItem>
                </Select>
                <Select defaultValue="30" label="الفترة">
                  <SelectItem value="7">آخر 7 أيام</SelectItem>
                  <SelectItem value="30">آخر 30 يوم</SelectItem>
                  <SelectItem value="90">آخر 90 يوم</SelectItem>
                </Select>
              </div>
            </div>

            <div className="rounded-3xl border-[1.5px] border-portal-card-border bg-portal-bg p-5">
              <p className="text-sm font-semibold text-natural-100">
                قاعدة الإجراء الأساسي
              </p>
              <p className="mt-2 text-sm leading-6 text-portal-note-text">
                كل صفحة لها إجراء أساسي واحد فقط. باقي الأفعال تكون outline أو
                ghost حتى لا يتشتت المستخدم.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="الحالات والوسوم"
          description="الألوان تعني حالة عمل، وليست ديكوراً."
          icon={Activity}
        >
          <div className="flex flex-wrap gap-3">
            {statusSamples.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Pill tone="neutral">محايد</Pill>
            <Pill tone="success">مكتمل</Pill>
            <Pill tone="warning">يحتاج انتباه</Pill>
            <Pill tone="danger">خطر</Pill>
            <Pill tone="blue">معلومة</Pill>
            <Pill tone="purple">مراجعة</Pill>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="الجداول التشغيلية"
          description="الجداول هي النمط الأساسي للبيانات الكثيفة في CRM، PM، Finance، وAdmin."
          icon={BarChart3}
        >
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Input
              className="lg:w-80"
              icon={<Search className="h-4 w-4" />}
              size="lg"
              placeholder="بحث داخل السجلات"
            />
            <FilterBar
              groups={[
                {
                  key: "status",
                  label: "الحالة",
                  options: [
                    { label: "الكل", value: "all" },
                    { label: "نشط", value: "active" },
                    { label: "بحاجة انتباه", value: "attention" },
                    { label: "متأخر", value: "late" },
                  ],
                },
              ]}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          </div>

          <DataTable
            columns={tableColumns}
            data={records}
            isLoading={false}
            isError={false}
            emptyState={tableEmptyState}
            renderRow={(record) => (
              <tr
                key={record.id}
                className="border-b border-portal-divider last:border-0"
              >
                <td className="px-5 py-4 text-right">
                  <p className="text-sm font-semibold text-natural-100">
                    {record.name}
                  </p>
                  <p className="mt-1 text-xs text-portal-note-text">
                    {record.meta}
                  </p>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={record.owner} size="sm" />
                    <span className="text-sm text-natural-100">
                      {record.owner}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <StatusBadge status={record.status} />
                </td>
                <td className="px-5 py-4 text-center text-sm font-semibold text-natural-100">
                  {record.value}
                </td>
                <td className="px-5 py-4 text-right text-sm text-portal-note-text">
                  {record.next}
                </td>
              </tr>
            )}
          />
        </SurfaceCard>

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <SurfaceCard
            title="تفاصيل وسجل نشاط"
            description="استخدم Tabs في صفحات التفاصيل، وليس في الصفحات البسيطة."
            icon={FileText}
          >
            <Tabs defaultValue="overview" dir="rtl">
              <TabsList>
                <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                <TabsTrigger value="activity">النشاط</TabsTrigger>
                <TabsTrigger value="files">الملفات</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 pt-3">
                <div className="grid gap-4 md:grid-cols-3">
                  <Fact icon={Users} label="المالك" value="فريق المبيعات" />
                  <Fact icon={CalendarClock} label="الاستحقاق" value="اليوم" />
                  <Fact icon={Clock3} label="SLA" value="6 ساعات" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-natural-100">
                      تقدم المشروع
                    </p>
                    <p className="text-sm text-portal-note-text">72%</p>
                  </div>
                  <ProgressBar value={72} showLabel />
                </div>
              </TabsContent>
              <TabsContent value="activity" className="pt-3">
                <div className="space-y-3">
                  <TimelineLine
                    icon={CheckCircle2}
                    title="تمت الموافقة على العرض"
                    meta="قبل ساعتين · بواسطة سارة"
                  />
                  <TimelineLine
                    icon={AlertTriangle}
                    title="مطلوب تحديث موعد التسليم"
                    meta="أمس · بواسطة مدير المشروع"
                  />
                </div>
              </TabsContent>
              <TabsContent value="files" className="pt-3">
                <EmptyState
                  icon={FileText}
                  title="لا توجد ملفات"
                  hint="ستظهر ملفات العقود، المرفقات، والتقارير هنا."
                />
              </TabsContent>
            </Tabs>
          </SurfaceCard>

          <SurfaceCard
            title="حالات الصفحة"
            description="كل صفحة يجب أن تملك loading، empty، error، وsuccess feedback."
            icon={Sparkles}
          >
            <div className="space-y-3">
              <StatusBanner variant="success" title="تم حفظ التغييرات">
                استخدمها بعد الإجراءات المهمة فقط.
              </StatusBanner>
              <StatusBanner variant="warning" title="يوجد خطر تأخير">
                استخدمها عندما يحتاج المستخدم إلى قرار.
              </StatusBanner>
              <StatusBanner variant="danger" title="تعذر تنفيذ العملية">
                وضح السبب والخطوة التالية دائماً.
              </StatusBanner>
              <EmptyState
                icon={Target}
                title="القائمة فارغة"
                hint="هذا النمط مخصص للصفحات التي لا تحتوي على سجلات بعد."
                action={
                  <ActionButton variant="primary">إضافة أول سجل</ActionButton>
                }
              />
            </div>
          </SurfaceCard>
        </div>
      <SurfaceCard
        title="تدقيق المكونات"
        description="كل مشكلة تحتوي على المكونات المتشابهة مع معاينة حية للمقارنة، واقتراح القرار النهائي."
        icon={Activity}
      >
        <div className="space-y-6">
          {/* ── 1. عرض قيمة رقمية (KPI) ── */}
          <OverlapGroup
            title="1. عرض قيمة رقمية (KPI)"
            recommendation="المعيار الموحد — MetricCard يدسم الأحجام والميزات"
            action="none"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniCompare name="MetricCard" usage={49} keep>
                <MetricCard title="قياسي (lg)" value="128" pillText="+12%" pillTone="success" />
              </MiniCompare>
              <MiniCompare name="MetricCard + amount" usage={5}>
                <MetricCard title="بعملة" amount={128000} />
              </MiniCompare>
              <MiniCompare name="MetricCard + trend" usage={12}>
                <MetricCard title="مع اتجاه" value="128" trend="up" trendValue="+12%" />
              </MiniCompare>
              <MiniCompare name="MetricCard + icon" usage={15}>
                <MetricCard title="مع أيقونة" value="128" icon={<Target className="h-5 w-5 text-secondary-500" />} />
              </MiniCompare>
              <MiniCompare name="MetricCard + variant" usage={20}>
                <MetricCard title="نجاح" value="128" variant="success" />
              </MiniCompare>
              <MiniCompare name="MetricCard + variant" usage={8}>
                <MetricCard title="تحذير" value="128" variant="warning" />
              </MiniCompare>
            </div>
          </OverlapGroup>

          {/* ── 2. بطاقات هيكلية (Containers) ── */}
          <OverlapGroup
            title="2. بطاقات هيكلية (Containers)"
            recommendation="استخدم SurfaceCard — المعيار المعتمد (100+)"
            action="remove"
            removeItems="ShowcaseCard → SurfaceCard يغطي نفس الاستخدام"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniCompare name="SurfaceCard" usage={100} keep>
                <SurfaceCard title="محتوى"><p className="text-sm text-portal-note-text">أي محتوى</p></SurfaceCard>
              </MiniCompare>
              <MiniCompare name="AlertCard" usage={2}>
                <AlertCard variant="info" title="معلومات">نص التنبيه</AlertCard>
              </MiniCompare>
              <MiniCompare name="ShowcaseCard" usage={0} remove>
                <ShowcaseCard title="عرض" body={<p className="text-sm text-portal-note-text">محتوى</p>} />
              </MiniCompare>
              <MiniCompare name="QuickLinkCard" usage={0}>
                <QuickLinkCard href="#" title="تقارير" icon={BarChart3} />
              </MiniCompare>
              <MiniCompare name="PmCard" usage={0}>
                <PmCard name="أحمد" role="مدير مشاريع" status="online" />
              </MiniCompare>
            </div>
          </OverlapGroup>

          {/* ── 3. العملات ── */}
          <OverlapGroup
            title="3. العملات"
            recommendation="استخدم MetricCard مع amount — يعرض العملة تلقائياً"
            action="none"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniCompare name="MetricCard + amount" usage={5}>
                <MetricCard title="الإيرادات" amount={128000} />
              </MiniCompare>
              <MiniCompare name="KpiCurrency (تصدير)" usage={3} keep>
                <MetricCard title="KpiCurrency" value={<KpiCurrency amount={128000} />} />
              </MiniCompare>
              <MiniCompare name="CurrencySymbol" usage={12}>
                <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-3 text-sm text-portal-note-text">
                  يستخدم داخلياً عبر useCurrency
                </div>
              </MiniCompare>
            </div>
          </OverlapGroup>

          {/* ── 4. القوائم الجانبية ── */}
          <OverlapGroup
            title="4. القوائم الجانبية (Sidebars)"
            recommendation="ادمج في AppSidebar واحد مع nav source قابل للتبديل"
            action="merge"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniCompare name="Sidebar" usage={1} merge>
                <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-3 text-sm text-portal-note-text">
                  <p className="font-semibold text-natural-100 mb-1">Portail</p>
                  <p>nav من portal-navigation.ts · 336px</p>
                </div>
              </MiniCompare>
              <MiniCompare name="DashboardSidebar" usage={1} merge>
                <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-3 text-sm text-portal-note-text">
                  <p className="font-semibold text-natural-100 mb-1">Dashboard</p>
                  <p>nav من navigation.ts · 336px · 98% تطابق</p>
                </div>
              </MiniCompare>
            </div>
          </OverlapGroup>

          {/* ── 5. الرؤوس العلوية ── */}
          <OverlapGroup
            title="5. الرؤوس العلوية (Headers)"
            recommendation="ادمج في AppHeader واحد مع onMenuToggle اختياري"
            action="merge"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniCompare name="AppHeader" usage={1} merge>
                <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-3 text-sm text-portal-note-text">
                  <p className="font-semibold text-natural-100 mb-1">Portal Header</p>
                  <p>100px · NotificationBell</p>
                </div>
              </MiniCompare>
              <MiniCompare name="DashboardAppHeader" usage={1} merge>
                <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-3 text-sm text-portal-note-text">
                  <p className="font-semibold text-natural-100 mb-1">Dashboard Header</p>
                  <p>100px · DashboardNotificationBell · Menu hamburger</p>
                </div>
              </MiniCompare>
            </div>
          </OverlapGroup>

          {/* ── 6. الإشعارات (Bells + Dropdowns) ── */}
          <OverlapGroup
            title="6. الإشعارات (Bells + Dropdowns)"
            recommendation="ادمج NotificationBell/DashboardNotificationBell بمكون واحد · احذف common/ (كود ميت)"
            action="merge"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniCompare name="NotificationBell" usage={1} merge>
                <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-3 text-sm text-portal-note-text">
                  يتطلب Redux
                </div>
              </MiniCompare>
              <MiniCompare name="DashboardNotifBell" usage={1} merge>
                <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-3 text-sm text-portal-note-text">
                  يتطلب Redux
                </div>
              </MiniCompare>
              <MiniCompare name="common/NotifBell" usage={0} remove>
                <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-3 text-sm text-danger-500">
                  كود ميت
                </div>
              </MiniCompare>
              <MiniCompare name="common/NotifDropdown" usage={0} remove>
                <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-3 text-sm text-danger-500">
                  كود ميت (util فقط مستخدم)
                </div>
              </MiniCompare>
            </div>
          </OverlapGroup>

          {/* ── 7. المدخلات والنماذج ── */}
          <OverlapGroup
            title="7. المدخلات والنماذج"
            recommendation="لا تغيير — تصميم 3-tier مقصود: Input لأشرطة الأدوات، FormInput لحقول بسيطة، FormInputControl لـ shadcn Form"
            action="none"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniCompare name="Input" usage={20}>
                <Input placeholder="بحث …" size="md" />
              </MiniCompare>
              <MiniCompare name="FormInput" usage={6}>
                <FormInput label="الاسم" placeholder="أدخل …" />
              </MiniCompare>
              <MiniCompare name="Select" usage={5}>
                <Select placeholder="اختر">
                  <SelectItem value="1">خيار</SelectItem>
                </Select>
              </MiniCompare>
              <MiniCompare name="FormTextarea" usage={3}>
                <FormTextarea label="ملاحظات" placeholder="اكتب …" />
              </MiniCompare>
            </div>
            <p className="text-xs text-portal-note-text mt-2">
              FormInputControl (23) · FormTextareaControl (9) · FormSelectControl (12) — مكونات داخلية لـ shadcn FormControl، لا تعرض بشكل مستقل
            </p>
          </OverlapGroup>

          {/* ── 8. أخرى ── */}
          <OverlapGroup
            title="8. أخرى"
            recommendation="احذف MetricSwitcher و CountChip (غير مستخدمين)"
            action="remove"
            removeItems="MetricSwitcher (0), CountChip (0)"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniCompare name="Pill" usage={25} keep>
                <Pill tone="success">مكتمل</Pill>
              </MiniCompare>
              <MiniCompare name="Popover" usage={5}>
                <Popover trigger={<ActionButton variant="outline">فتح</ActionButton>}>
                  <p className="p-2 text-sm">محتوى</p>
                </Popover>
              </MiniCompare>
              <MiniCompare name="FilterBar" usage={1}>
                <FilterBar groups={[{ key: "s", label: "حالة", options: [{ label: "نشط", value: "active" }] }]} activeFilters={{}} onFilterChange={() => {}} />
              </MiniCompare>
              <MiniCompare name="TimeRangeSelector" usage={1}>
                <TimeRangeSelector value="last30days" onChange={() => {}} />
              </MiniCompare>
              <MiniCompare name="MetricSwitcher" usage={0} remove>
                <MetricSwitcher value="all" onChange={() => {}} />
              </MiniCompare>
              <MiniCompare name="CountChip" usage={0} remove>
                <CountChip hasFilter={false} total={42} visible={42} unfilteredLabel="كل السجلات" icon={<FileText className="h-4 w-4" />} />
              </MiniCompare>
            </div>
          </OverlapGroup>
        </div>
      </SurfaceCard>
      </div>
    </main>
  );
}

function OverlapGroup({
  title,
  recommendation,
  action,
  removeItems,
  children,
}: {
  title: string;
  recommendation: string;
  action: "keep" | "remove" | "merge" | "none";
  removeItems?: string;
  children: React.ReactNode;
}) {
  const actionStyles = {
    keep: "bg-success-500/10 text-success-600 border-success-200",
    remove: "bg-danger-500/10 text-danger-600 border-danger-200",
    merge: "bg-warning-500/10 text-warning-600 border-warning-200",
    none: "bg-blue-500/10 text-blue-600 border-blue-200",
  };
  const actionLabels: Record<string, string> = {
    keep: "احتفظ",
    remove: "احذف",
    merge: "ادمج",
    none: "لا تغيير",
  };

  return (
    <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-4">
      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-natural-100">{title}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${actionStyles[action]}`}>
            {actionLabels[action]}
          </span>
          <span className="text-xs text-portal-note-text">{recommendation}</span>
        </div>
      </div>
      {children}
      {removeItems && (
        <p className="text-xs text-danger-500 mt-2">
          🗑 {removeItems}
        </p>
      )}
    </div>
  );
}

function MiniCompare({
  name,
  usage,
  keep,
  remove,
  merge,
  children,
}: {
  name: string;
  usage: number;
  keep?: boolean;
  remove?: boolean;
  merge?: boolean;
  children: React.ReactNode;
}) {
  const badge = keep ? "✅ " : remove ? "" : merge ? "🔄 " : "";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-natural-100">{badge}{name}</span>
        <span className={`text-xs font-semibold ${usage === 0 ? "text-danger-500" : usage <= 3 ? "text-warning-500" : "text-success-500"}`}>
          {usage}
        </span>
      </div>
      {children}
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-4">
      <Icon className="mb-3 h-5 w-5 text-portal-icon" />
      <p className="text-xs text-portal-note-text">{label}</p>
      <p className="mt-1 text-sm font-semibold text-natural-100">{value}</p>
    </div>
  );
}

function TimelineLine({
  icon: Icon,
  title,
  meta,
}: {
  icon: LucideIcon;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-portal-card-border bg-portal-bg p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-natural-0">
        <Icon className="h-5 w-5 text-secondary-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-natural-100">{title}</p>
        <p className="mt-1 text-xs text-portal-note-text">{meta}</p>
      </div>
    </div>
  );
}
