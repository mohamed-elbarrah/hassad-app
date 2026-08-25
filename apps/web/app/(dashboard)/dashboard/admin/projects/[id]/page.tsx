"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeAlert, FolderKanban } from "lucide-react";
import {
  PROJECT_STATUS_AR,
  TASK_PRIORITY_AR,
  TaskPriority,
} from "@hassad/shared";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";
import {
  buildAdminProjectStats,
  buildProjectCommercialFields,
  buildProjectOperationsFields,
  buildProjectSignals,
  ProjectDetailLoading,
  ProjectFilesTable,
  ProjectHistoryTable,
  ProjectInvoicesTable,
  ProjectMeetingsTable,
  ProjectOverviewCard,
  ProjectPaymentsTable,
  ProjectPeriodsTable,
  ProjectPreviewHeader,
  ProjectRecordsTabs,
  ProjectSignalsCard,
  ProjectSummaryCard,
  ProjectTasksTable,
  ProjectTeamTable,
  ProjectStatsGrid,
} from "@/components/project-detail/ProjectDetailPattern";
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  formatCurrency,
  formatDateTime,
  formatPortalDate,
  formatNumber,
} from "@/lib/format";

function isOverdue(date?: string | null) {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

function sortByDateAsc<
  T extends { dueDate?: string | null; scheduledAt?: string | null },
>(items: T[], key: "dueDate" | "scheduledAt") {
  return [...items].sort((a, b) => {
    const left = a[key]
      ? new Date(a[key] as string).getTime()
      : Number.MAX_SAFE_INTEGER;
    const right = b[key]
      ? new Date(b[key] as string).getTime()
      : Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading, isError } = useGetAdminProjectByIdQuery(id);

  if (isLoading) {
    return <ProjectDetailLoading />;
  }

  if (isError || !project) {
    return (
      <div className="  " dir="rtl">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <FolderKanban />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>المشروع غير موجود</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على بيانات هذا المشروع.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/admin/projects">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى المشاريع
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overdueTasks = project.tasks.filter(
    (task) => task.status !== "DONE" && isOverdue(task.dueDate),
  );
  const unassignedTasks = project.tasks.filter((task) => !task.assignedTo);
  const inReviewTasks = project.tasks.filter(
    (task) => task.status === "IN_REVIEW",
  );
  const completedTasks = project.tasks.filter((task) => task.status === "DONE");
  const pendingInvoices = project.invoices.filter(
    (invoice) => invoice.status !== "PAID",
  );
  const collectedValue = project.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const sortedOpenTasks = sortByDateAsc(
    project.tasks.filter((task) => task.status !== "DONE"),
    "dueDate",
  );
  const nextDueTask = sortedOpenTasks.find((task) => task.dueDate);
  const upcomingMeetings = sortByDateAsc(
    project.meetings.filter(
      (meeting) => new Date(meeting.scheduledAt).getTime() >= Date.now(),
    ),
    "scheduledAt",
  );
  const nextMeeting = upcomingMeetings[0];
  const completedPeriods = project.periods.filter(
    (period) =>
      period.status === "COMPLETED" || period.completionPercentage === 100,
  ).length;
  const tasksPreview = [...project.tasks]
    .sort((a, b) => {
      const overdueDiff =
        Number(isOverdue(b.dueDate)) - Number(isOverdue(a.dueDate));
      if (overdueDiff !== 0) return overdueDiff;
      return (
        new Date(a.dueDate || "2999-12-31").getTime() -
        new Date(b.dueDate || "2999-12-31").getTime()
      );
    })
    .slice(0, 6);
  const periodsPreview = [...project.periods]
    .sort((a, b) => b.periodNumber - a.periodNumber)
    .slice(0, 5);
  const historyPreview = [...project.history]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);
  const invoicesPreview = (
    pendingInvoices.length > 0 ? pendingInvoices : project.invoices
  ).slice(0, 5);
  const paymentsPreview = [...project.payments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);
  const filesPreview = [...project.files]
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )
    .slice(0, 5);
  const meetingsPreview = (
    upcomingMeetings.length > 0 ? upcomingMeetings : project.meetings
  ).slice(0, 4);

  const stats = buildAdminProjectStats({
    tasksCount: project.tasks.length,
    overdueTasksCount: overdueTasks.length,
    membersCount: project.members.length,
    pendingInvoicesCount: pendingInvoices.length,
    completionPercentage: project.completionPercentage,
    totalValue: project.totalValue,
    collectedValue,
  });

  const operationsFields = buildProjectOperationsFields({
    clientName: project.client.companyName,
    managerName: project.manager?.name || "غير محدد",
    startDate: formatPortalDate(project.startDate) || "—",
    endDate: formatPortalDate(project.endDate) || "—",
    updatedAt: formatDateTime(project.updatedAt),
    archiveLabel: project.isArchived ? "مؤرشف" : "نشط",
    completionLabel: `${formatNumber(project.completionPercentage)}%`,
    nextDueLabel: nextDueTask
      ? `${nextDueTask.title} - ${formatPortalDate(nextDueTask.dueDate) || "—"}`
      : "لا يوجد موعد قريب",
  });

  const commercialFields = buildProjectCommercialFields({
    contractValue: project.contract
      ? formatCurrency(project.contract.totalValue)
      : "—",
    monthlyValue: formatCurrency(
      project.contract?.monthlyValue ?? project.monthlyValue,
    ),
    totalValue: formatCurrency(project.totalValue),
    collectedValue: formatCurrency(collectedValue),
    pendingInvoicesCount: `${formatNumber(pendingInvoices.length)} فاتورة`,
    periodsCount: `${formatNumber(project.periods.length)} فترة`,
    meetingsCount: `${formatNumber(project.meetings.length)} اجتماع`,
    tasksCount: `${formatNumber(project.tasks.length)} مهمة`,
  });

  const signals = buildProjectSignals({
    overdueTasksCount: overdueTasks.length,
    unassignedTasksCount: unassignedTasks.length,
    inReviewTasksCount: inReviewTasks.length,
    nextDueLabel: nextDueTask
      ? formatPortalDate(nextDueTask.dueDate) || "—"
      : "لا يوجد",
    nextMeetingLabel: nextMeeting
      ? formatDateTime(nextMeeting.scheduledAt)
      : "لا يوجد اجتماع مجدول",
    completedPeriods,
    totalPeriods: project.periods.length,
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <ProjectSummaryCard
        project={project}
        badges={[
          <Badge key="priority" variant="outline">
            الأولوية:{" "}
            {TASK_PRIORITY_AR[project.priority as TaskPriority] ||
              project.priority}
          </Badge>,
          <Badge key="window" variant="outline">
            {formatPortalDate(project.startDate) || "—"} إلى{" "}
            {formatPortalDate(project.endDate) || "—"}
          </Badge>,
          pendingInvoices.length > 0 ? (
            <Badge key="finance-alert" variant="destructive">
              {formatNumber(pendingInvoices.length)} فواتير مفتوحة
            </Badge>
          ) : null,
        ].filter(Boolean)}
      />

      <ProjectStatsGrid stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <ProjectOverviewCard
          operationsFields={operationsFields}
          commercialFields={commercialFields}
        />
        <ProjectSignalsCard items={signals} />
      </div>

      <ProjectRecordsTabs
        title="العمليات المرتبطة"
        description="معاينة سريعة لأهم العناصر داخل المشروع قبل الدخول إلى التبويبات التفصيلية."
        defaultValue="tasks"
        tabs={[
          {
            value: "tasks",
            label: "المهام",
            count: project.tasks.length,
            content: (
              <div className="flex flex-col gap-4">
                <ProjectPreviewHeader
                  title={`منها ${formatNumber(completedTasks.length)} منجزة و${formatNumber(
                    overdueTasks.length,
                  )} متأخرة فعليًا.`}
                  href={`/dashboard/admin/projects/${id}/tasks`}
                />
                <ProjectTasksTable tasks={tasksPreview} />
              </div>
            ),
          },
          {
            value: "team",
            label: "الفريق",
            count: project.members.length,
            content: (
              <div className="flex flex-col gap-4">
                <ProjectPreviewHeader
                  title="الأعضاء المشاركون فعليًا في التنفيذ."
                  href={`/dashboard/admin/projects/${id}/team`}
                />
                <ProjectTeamTable members={project.members} />
              </div>
            ),
          },
          {
            value: "periods",
            label: "الفترات",
            count: project.periods.length,
            content: (
              <div className="flex flex-col gap-4">
                <ProjectPreviewHeader
                  title={`تم إكمال ${formatNumber(completedPeriods)} من أصل ${formatNumber(
                    project.periods.length,
                  )} فترات.`}
                  href={`/dashboard/admin/projects/${id}/periods`}
                />
                <ProjectPeriodsTable periods={periodsPreview} />
              </div>
            ),
          },
          {
            value: "finance",
            label: "المالية",
            count: project.invoices.length + project.payments.length,
            content: (
              <div className="flex flex-col gap-6">
                <ProjectPreviewHeader
                  title="تركيز على التحصيل والفواتير المفتوحة بدل المعرّفات الفنية."
                  href={`/dashboard/admin/projects/${id}/finance`}
                />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "قيمة العقد",
                      value: project.contract
                        ? formatCurrency(project.contract.totalValue)
                        : "—",
                    },
                    {
                      label: "المحصل",
                      value: formatCurrency(collectedValue),
                    },
                    {
                      label: "الفواتير المفتوحة",
                      value: formatNumber(pendingInvoices.length),
                    },
                    {
                      label: "الدفعات المسجلة",
                      value: formatNumber(project.payments.length),
                    },
                  ].map((item) => (
                    <Card key={item.label}>
                      <CardContent className="flex flex-col gap-2 p-4">
                        <span className="text-sm text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-base font-semibold">
                          {item.value}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      الفواتير الأهم حاليًا
                    </p>
                    <ProjectInvoicesTable invoices={invoicesPreview} />
                  </div>
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      آخر الدفعات المسجلة
                    </p>
                    <ProjectPaymentsTable payments={paymentsPreview} />
                  </div>
                </div>
              </div>
            ),
          },
          {
            value: "assets",
            label: "الملفات والاجتماعات",
            count: project.files.length + project.meetings.length,
            content: (
              <div className="flex flex-col gap-6">
                <ProjectPreviewHeader title="ملفات العمل والاجتماعات القادمة أو الأحدث." />
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      أحدث الملفات
                    </p>
                    <ProjectFilesTable
                      files={filesPreview.map((file) => ({
                        id: file.id,
                        fileName: file.fileName,
                        uploadedBy: file.uploadedBy,
                        uploadedAt: file.uploadedAt,
                      }))}
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">الاجتماعات</p>
                    <ProjectMeetingsTable meetings={meetingsPreview} />
                  </div>
                </div>
              </div>
            ),
          },
          {
            value: "history",
            label: "السجل",
            count: project.history.length,
            content: (
              <div className="flex flex-col gap-4">
                <ProjectPreviewHeader
                  title="آخر الحركات الإدارية الأكثر صلة بمتابعة المشروع."
                  href={`/dashboard/admin/projects/${id}/timeline`}
                />
                <ProjectHistoryTable history={historyPreview} />
              </div>
            ),
          },
        ]}
      />

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>قراءة إدارية سريعة</CardTitle>
          <CardDescription>
            هذا الملخص يستبعد المعرفات الداخلية ويركز على ما يساعد في القرار
            والمتابعة.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "حالة المشروع",
              value:
                PROJECT_STATUS_AR[
                  project.status as keyof typeof PROJECT_STATUS_AR
                ] || project.status,
              hint: project.isArchived
                ? "المشروع مؤرشف حاليًا"
                : "المشروع داخل الدورة النشطة",
            },
            {
              label: "تغطية الفريق",
              value: `${formatNumber(project.members.length)} أعضاء`,
              hint:
                unassignedTasks.length > 0
                  ? `${formatNumber(unassignedTasks.length)} مهام تحتاج إسناد`
                  : "لا توجد مهام غير مسندة",
            },
            {
              label: "المراجعات الحالية",
              value: `${formatNumber(inReviewTasks.length)} مهام`,
              hint:
                inReviewTasks.length > 0
                  ? "توجد عناصر تنتظر قرارًا أو اعتمادًا"
                  : "لا توجد عناصر معلقة في المراجعة",
            },
            {
              label: "الاجتماع القادم",
              value: nextMeeting
                ? formatPortalDate(nextMeeting.scheduledAt) || "—"
                : "لا يوجد",
              hint: nextMeeting?.title || "لم يتم جدولة اجتماع جديد بعد",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <BadgeAlert className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <p className="mt-3 text-base font-semibold">{item.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
