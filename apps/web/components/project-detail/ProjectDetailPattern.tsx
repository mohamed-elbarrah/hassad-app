"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileClock,
  FolderKanban,
  History,
  Inbox,
  Layers3,
  NotebookTabs,
  Users,
} from "lucide-react";
import {
  INVOICE_STATUS_AR,
  MEETING_STATUS_AR,
  PROJECT_STATUS_AR,
  TASK_PRIORITY_AR,
  TASK_STATUS_AR,
  TaskPriority,
} from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDateTime, formatPortalDate, formatNumber } from "@/lib/format";
import { invoiceStatusLabel, paymentStatusLabel, UNKNOWN_STATUS_LABEL } from "@/lib/i18n";

type NullableString = string | null | undefined;

export interface ProjectDetailEntity {
  id: string;
  name: string;
  description?: NullableString;
  status: string;
  priority: string;
  clientId: string;
  startDate?: NullableString;
  endDate?: NullableString;
  completionPercentage: number;
  updatedAt?: NullableString;
  isArchived?: boolean;
  client: { id: string; companyName: string };
  manager?: { id: string; name: string; email?: string } | null;
  contract?: { totalValue?: number; monthlyValue?: number } | null;
  totalValue?: number;
  monthlyValue?: number;
}

export interface ProjectStatItem {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
}

export interface ProjectInfoFieldItem {
  label: string;
  value?: string | null;
  dir?: "rtl" | "ltr";
}

export interface ProjectSignalItem {
  label: string;
  value: string;
  description: string;
  tone?: "outline" | "secondary" | "destructive";
}

export interface ProjectDetailTab {
  value: string;
  label: string;
  count?: number;
  content: ReactNode;
}

export interface ProjectTaskRecord {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: NullableString;
  assignedTo?: NullableString;
  assigneeName?: NullableString;
}

export interface ProjectMemberRecord {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string; email: string };
}

export interface ProjectPeriodRecord {
  id: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: string;
  completionPercentage: number;
}

export interface ProjectInvoiceRecord {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate?: NullableString;
  createdAt: string;
}

export interface ProjectPaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface ProjectFileRecord {
  id: string;
  fileName: string;
  uploadedBy?: NullableString;
  uploadedAt: string;
}

export interface ProjectMeetingRecord {
  id: string;
  title: string;
  scheduledAt: string;
  notes?: NullableString;
}

export interface ProjectHistoryRecord {
  id: string;
  action: string;
  userName?: NullableString;
  createdAt: string;
}

function isOverdue(date?: NullableString) {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

function statusVariant(status?: string | null) {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
    case "PAID":
    case "DONE":
      return "secondary";
    case "CANCELLED":
    case "STOPPED":
    case "LATE":
    case "OVERDUE":
    case "URGENT":
      return "destructive";
    default:
      return "outline";
  }
}

function priorityVariant(priority?: string | null) {
  switch (priority) {
    case TaskPriority.URGENT:
      return "destructive";
    case TaskPriority.HIGH:
      return "secondary";
    default:
      return "outline";
  }
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="border bg-muted/30 p-10">
      <EmptyMedia variant="icon">
        <Inbox />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function InfoField({ label, value, dir }: ProjectInfoFieldItem) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium" dir={dir}>
        {value || "—"}
      </p>
    </div>
  );
}

export function ProjectDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="flex gap-4 p-6">
            <Skeleton className="size-20 rounded-lg" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-40" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="size-10 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader className="gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectDetailHeader({
  project,
  badges = [],
  actions,
}: {
  project: ProjectDetailEntity;
  badges?: ReactNode[];
  actions?: ReactNode;
}) {
  return (
    <PageHeader
      title={project.name}
      description={project.description || "ملخص واضح للتنفيذ التجاري والتشغيلي لهذا المشروع."}
      icon={FolderKanban}
      actions={actions}
      badges={[
        <Badge key="status" variant={statusVariant(project.status)}>
          {PROJECT_STATUS_AR[project.status as keyof typeof PROJECT_STATUS_AR] || UNKNOWN_STATUS_LABEL}
        </Badge>,
        project.isArchived ? <Badge key="archived" variant="outline">مؤرشف</Badge> : null,
        <Badge key="client" variant="outline">العميل: {project.client.companyName}</Badge>,
        <Badge key="manager" variant="outline">مدير المشروع: {project.manager?.name || "غير محدد"}</Badge>,
        ...badges,
      ].filter(Boolean)}
    />
  );
}

export function ProjectStatsGrid({ stats }: { stats: ProjectStatItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stats.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-lg font-semibold">{item.value}</span>
              {item.hint ? (
                <span className="text-sm text-muted-foreground">{item.hint}</span>
              ) : null}
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <item.icon />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function buildAdminProjectStats({
  tasksCount,
  overdueTasksCount,
  membersCount,
  pendingInvoicesCount,
  completionPercentage,
  totalValue,
  collectedValue,
}: {
  tasksCount: number;
  overdueTasksCount: number;
  membersCount: number;
  pendingInvoicesCount: number;
  completionPercentage: number;
  totalValue: number;
  collectedValue: number;
}) {
  return [
    {
      label: "نسبة الإنجاز",
      value: `${formatNumber(completionPercentage)}%`,
      hint: `${formatNumber(tasksCount)} مهمة`,
      icon: NotebookTabs,
    },
    {
      label: "المهام المتأخرة",
      value: formatNumber(overdueTasksCount),
      hint: overdueTasksCount > 0 ? "تحتاج متابعة مباشرة" : "لا يوجد تأخير حرج",
      icon: AlertTriangle,
    },
    {
      label: "التحصيل",
      value: formatCurrency(collectedValue),
      hint: `${formatCurrency(totalValue)} قيمة المشروع`,
      icon: CircleDollarSign,
    },
    {
      label: "الفريق والفواتير",
      value: `${formatNumber(membersCount)} أعضاء`,
      hint: `${formatNumber(pendingInvoicesCount)} فواتير مفتوحة`,
      icon: Users,
    },
  ] satisfies ProjectStatItem[];
}

export function ProjectOverviewCard({
  operationsFields,
  commercialFields,
}: {
  operationsFields: ProjectInfoFieldItem[];
  commercialFields: ProjectInfoFieldItem[];
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>ملف المشروع</CardTitle>
        <CardDescription>
          نفس البطاقة تجمع التشغيل اليومي والسياق التجاري بدون تفاصيل داخلية غير مفيدة.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs defaultValue="operations" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="operations">التشغيل</TabsTrigger>
            <TabsTrigger value="commercial">التجاري والمالي</TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2">
              {operationsFields.map((field) => (
                <InfoField key={field.label} {...field} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="commercial" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2">
              {commercialFields.map((field) => (
                <InfoField key={field.label} {...field} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function ProjectSignalsCard({
  items,
}: {
  items: ProjectSignalItem[];
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>نبض التنفيذ</CardTitle>
        <CardDescription>
          إشارات سريعة تساعد الإدارة على معرفة أين يلزم التدخل أو المتابعة.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-3 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{item.label}</span>
              <Badge variant={item.tone || "outline"}>{item.value}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function buildProjectSignals({
  overdueTasksCount,
  unassignedTasksCount,
  inReviewTasksCount,
  nextDueLabel,
  nextMeetingLabel,
  completedPeriods,
  totalPeriods,
}: {
  overdueTasksCount: number;
  unassignedTasksCount: number;
  inReviewTasksCount: number;
  nextDueLabel: string;
  nextMeetingLabel: string;
  completedPeriods: number;
  totalPeriods: number;
}) {
  return [
    {
      label: "المهام الحرجة",
      value: formatNumber(overdueTasksCount),
      description:
        overdueTasksCount > 0
          ? "يوجد تأخير فعلي في المهام ويتطلب متابعة مباشرة."
          : "لا توجد مهام متأخرة حاليًا.",
      tone: overdueTasksCount > 0 ? "destructive" : "secondary",
    },
    {
      label: "التوزيع على الفريق",
      value: formatNumber(unassignedTasksCount),
      description:
        unassignedTasksCount > 0
          ? "هذه المهام غير مسندة وقد تبطئ التنفيذ."
          : "كل المهام الحالية مسندة لأعضاء واضحين.",
      tone: unassignedTasksCount > 0 ? "outline" : "secondary",
    },
    {
      label: "المراجعات الحالية",
      value: formatNumber(inReviewTasksCount),
      description:
        inReviewTasksCount > 0
          ? "هناك مخرجات تنتظر اعتمادًا أو قرارًا."
          : "لا توجد مهام معلقة في المراجعة الآن.",
      tone: "outline",
    },
    {
      label: "أقرب موعد تنفيذي",
      value: nextDueLabel,
      description: `الاجتماع القادم: ${nextMeetingLabel}`,
      tone: "outline",
    },
    {
      label: "تقدم الفترات",
      value: `${formatNumber(completedPeriods)}/${formatNumber(totalPeriods)}`,
      description:
        totalPeriods > 0
          ? "متابعة الفترات توضح إذا كان المشروع يتقدم على الخطة."
          : "لم يتم إنشاء فترات لهذا المشروع بعد.",
      tone: "outline",
    },
  ] satisfies ProjectSignalItem[];
}

export function ProjectRecordsTabs({
  title,
  description,
  tabs,
  defaultValue,
}: {
  title: string;
  description: string;
  tabs: ProjectDetailTab[];
  defaultValue?: string;
}) {
  const visibleTabs = tabs.filter(Boolean);

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs defaultValue={defaultValue ?? visibleTabs[0]?.value} dir="rtl">
          <TabsList
            className={`grid h-auto w-full justify-start rounded-none border-b bg-transparent p-0 ${
              visibleTabs.length >= 6
                ? "grid-cols-2 md:grid-cols-6"
                : visibleTabs.length === 5
                  ? "grid-cols-2 md:grid-cols-5"
                  : visibleTabs.length === 4
                    ? "grid-cols-2 md:grid-cols-4"
                    : "grid-cols-2"
            }`}
          >
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-auto rounded-none border-b-2 border-transparent px-4 py-3 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <span className="flex items-center gap-2">
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" ? (
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(tab.count)}
                    </span>
                  ) : null}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {visibleTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function ProjectPreviewHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pb-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      {href ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={href}>عرض الكل</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function ProjectTasksTable({ tasks }: { tasks: ProjectTaskRecord[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyPanel
        title="لا توجد مهام للعرض"
        description="عند إضافة مهام للمشروع ستظهر هنا بترتيب واضح."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المهمة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>الأولوية</TableHead>
            <TableHead>الاستحقاق</TableHead>
            <TableHead>المسند إليه</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(task.status)}>
                  {TASK_STATUS_AR[task.status as keyof typeof TASK_STATUS_AR] || UNKNOWN_STATUS_LABEL}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={priorityVariant(task.priority)}>
                  {TASK_PRIORITY_AR[task.priority as TaskPriority] || task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={isOverdue(task.dueDate) ? "text-destructive" : undefined}>
                  {formatPortalDate(task.dueDate) || "—"}
                </span>
              </TableCell>
              <TableCell>{task.assigneeName || (task.assignedTo ? "مسندة" : "غير مسندة")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProjectTeamTable({ members }: { members: ProjectMemberRecord[] }) {
  if (members.length === 0) {
    return (
      <EmptyPanel
        title="لا يوجد أعضاء فريق"
        description="لم يتم ربط أي عضو بهذا المشروع حتى الآن."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العضو</TableHead>
            <TableHead>الدور</TableHead>
            <TableHead>تاريخ الانضمام</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{member.user.name}</span>
                  <span className="text-xs text-muted-foreground">{member.user.email}</span>
                </div>
              </TableCell>
              <TableCell>{member.role}</TableCell>
              <TableCell>{formatDateTime(member.joinedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProjectPeriodsTable({ periods }: { periods: ProjectPeriodRecord[] }) {
  if (periods.length === 0) {
    return (
      <EmptyPanel
        title="لا توجد فترات"
        description="ستظهر الفترات هنا بعد جدولتها لهذا المشروع."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الفترة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>النطاق الزمني</TableHead>
            <TableHead>الإنجاز</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((period) => (
            <TableRow key={period.id}>
              <TableCell>الفترة {formatNumber(period.periodNumber)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(period.status)}>{MEETING_STATUS_AR[period.status as keyof typeof MEETING_STATUS_AR] || UNKNOWN_STATUS_LABEL}</Badge>
              </TableCell>
              <TableCell>
                {formatPortalDate(period.startDate) || "—"} إلى{" "}
                {formatPortalDate(period.endDate) || "—"}
              </TableCell>
              <TableCell>{formatNumber(period.completionPercentage)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProjectInvoicesTable({
  invoices,
}: {
  invoices: ProjectInvoiceRecord[];
}) {
  if (invoices.length === 0) {
    return (
      <EmptyPanel
        title="لا توجد فواتير مرتبطة"
        description="عند إصدار فواتير لهذا المشروع ستظهر هنا."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الفاتورة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>القيمة</TableHead>
            <TableHead>الاستحقاق</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium" dir="ltr">
                {invoice.invoiceNumber}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(invoice.status)}>
                  {INVOICE_STATUS_AR[invoice.status as keyof typeof INVOICE_STATUS_AR] ||
                    UNKNOWN_STATUS_LABEL}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(invoice.amount)}</TableCell>
              <TableCell>{formatPortalDate(invoice.dueDate) || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProjectPaymentsTable({
  payments,
}: {
  payments: ProjectPaymentRecord[];
}) {
  if (payments.length === 0) {
    return (
      <EmptyPanel
        title="لا توجد دفعات مرتبطة"
        description="ستظهر الدفعات هنا بمجرد تسجيلها على المشروع."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>القيمة</TableHead>
            <TableHead>الطريقة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>التاريخ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>{payment.paymentMethod}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(payment.status)}>{paymentStatusLabel(payment.status)}</Badge>
              </TableCell>
              <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProjectFilesTable({ files }: { files: ProjectFileRecord[] }) {
  if (files.length === 0) {
    return (
      <EmptyPanel
        title="لا توجد ملفات"
        description="عند رفع ملفات للمشروع ستظهر هنا باسم واضح وتاريخ الرفع."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الملف</TableHead>
            <TableHead>رافع الملف</TableHead>
            <TableHead>تاريخ الرفع</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium">{file.fileName}</TableCell>
              <TableCell>{file.uploadedBy || "—"}</TableCell>
              <TableCell>{formatDateTime(file.uploadedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProjectMeetingsTable({
  meetings,
}: {
  meetings: ProjectMeetingRecord[];
}) {
  if (meetings.length === 0) {
    return (
      <EmptyPanel
        title="لا توجد اجتماعات"
        description="عند جدولة اجتماعات لهذا المشروع ستظهر هنا."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاجتماع</TableHead>
            <TableHead>الموعد</TableHead>
            <TableHead>ملاحظات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetings.map((meeting) => (
            <TableRow key={meeting.id}>
              <TableCell className="font-medium">{meeting.title}</TableCell>
              <TableCell>{formatDateTime(meeting.scheduledAt)}</TableCell>
              <TableCell>{meeting.notes || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProjectHistoryTable({
  history,
}: {
  history: ProjectHistoryRecord[];
}) {
  if (history.length === 0) {
    return (
      <EmptyPanel
        title="لا يوجد سجل تغييرات"
        description="سيظهر السجل هنا فور وجود حركات إدارية على المشروع."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الإجراء</TableHead>
            <TableHead>المستخدم</TableHead>
            <TableHead>التاريخ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{entry.action}</TableCell>
              <TableCell>{entry.userName || "—"}</TableCell>
              <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function buildProjectOperationsFields({
  clientName,
  managerName,
  startDate,
  endDate,
  updatedAt,
  archiveLabel,
  completionLabel,
  nextDueLabel,
}: {
  clientName: string;
  managerName: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
  archiveLabel: string;
  completionLabel: string;
  nextDueLabel: string;
}) {
  return [
    { label: "العميل", value: clientName },
    { label: "مدير المشروع", value: managerName },
    { label: "تاريخ البداية", value: startDate },
    { label: "تاريخ النهاية", value: endDate },
    { label: "آخر تحديث", value: updatedAt },
    { label: "حالة الأرشفة", value: archiveLabel },
    { label: "نسبة الإنجاز", value: completionLabel },
    { label: "أقرب استحقاق", value: nextDueLabel },
  ] satisfies ProjectInfoFieldItem[];
}

export function buildProjectCommercialFields({
  contractValue,
  monthlyValue,
  totalValue,
  collectedValue,
  pendingInvoicesCount,
  periodsCount,
  meetingsCount,
  tasksCount,
}: {
  contractValue: string;
  monthlyValue: string;
  totalValue: string;
  collectedValue: string;
  pendingInvoicesCount: string;
  periodsCount: string;
  meetingsCount: string;
  tasksCount: string;
}) {
  return [
    { label: "قيمة العقد", value: contractValue },
    { label: "القيمة الشهرية", value: monthlyValue },
    { label: "قيمة المشروع الحالية", value: totalValue },
    { label: "المحصل حتى الآن", value: collectedValue },
    { label: "الفواتير المفتوحة", value: pendingInvoicesCount },
    { label: "عدد الفترات", value: periodsCount },
    { label: "عدد الاجتماعات", value: meetingsCount },
    { label: "إجمالي المهام", value: tasksCount },
  ] satisfies ProjectInfoFieldItem[];
}

export const projectStatIcons = {
  progress: NotebookTabs,
  overdue: AlertTriangle,
  finance: CircleDollarSign,
  team: Users,
  periods: Layers3,
  timeline: History,
  contract: FileClock,
  schedule: Clock3,
  monthly: CalendarDays,
};
