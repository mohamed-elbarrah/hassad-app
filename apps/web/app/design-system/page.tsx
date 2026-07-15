"use client";

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
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { EmptyState } from "@/components/design-system/EmptyState";
import { FilterPills } from "@/components/design-system/FilterPills";
import { Input } from "@/components/design-system/Input";
import { MetricCard } from "@/components/design-system/MetricCard";
import { PageIntro } from "@/components/design-system/PageIntro";
import { Pill } from "@/components/design-system/Pill";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { Select, SelectItem } from "@/components/design-system/Select";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/design-system/Tabs";
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
              placeholder="بحث داخل السجلات"
            />
            <FilterPills
              options={[
                { label: "الكل", value: "all" },
                { label: "نشط", value: "active" },
                { label: "بحاجة انتباه", value: "attention" },
                { label: "متأخر", value: "late" },
              ]}
              active="all"
              onChange={() => undefined}
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
      </div>
    </main>
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
