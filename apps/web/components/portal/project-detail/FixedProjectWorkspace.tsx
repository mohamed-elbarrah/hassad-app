"use client";

import {
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Megaphone,
  Paperclip,
  Target,
  Users,
} from "lucide-react";
import { MEETING_STATUS_AR, TASK_STATUS_AR, TaskStatus } from "@hassad/shared";
import type {
  PortalProjectDetail,
  PortalProjectWorkspace,
} from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "./EmptyState";
import { CampaignsTab } from "./CampaignsTab";
import { TasksTab } from "./TasksTab";
import { formatDateTz, formatFileSize, formatShortDate } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { invoiceStatusLabel, portalProjectStatusLabel } from "@/lib/i18n";
import { ProjectStatusProgress } from "@/components/portal/shared/ProjectStatusProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FixedProjectWorkspaceProps {
  project: PortalProjectDetail;
  resources: NonNullable<PortalProjectWorkspace["resources"]>;
  focusTaskId?: string | null;
  initialTab?: string | null;
}

export function FixedProjectWorkspace({
  project,
  resources,
  focusTaskId,
  initialTab,
}: FixedProjectWorkspaceProps) {
  const defaultTab =
    initialTab &&
    ["goals", "tasks", "files", "reports", "campaigns", "meetings", "invoices"].includes(initialTab)
      ? initialTab
      : "tasks";
  const { fmtAmount } = useCurrency();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المشروع</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-muted-foreground">الحالة</p>
            <Badge variant="secondary">
              {portalProjectStatusLabel(project.status)}
            </Badge>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground">نسبة الإنجاز</p>
              <p className="font-semibold">{project.completionPercentage}%</p>
            </div>
            <ProjectStatusProgress
              value={project.completionPercentage}
              status={project.status}
              label="نسبة إنجاز المشروع"
            />
          </div>
          <div>
            <p className="text-muted-foreground">تاريخ البدء</p>
            <p className="font-semibold">
              {formatShortDate(project.startDate)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">تاريخ الانتهاء</p>
            <p className="font-semibold">{formatShortDate(project.endDate)}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={defaultTab} dir="rtl">
        <TabsList className="h-auto w-full flex-wrap justify-start overflow-x-auto sm:flex-nowrap">
          <TabsTrigger value="goals" className="gap-2 py-2.5">
            <Target className="size-4" />
            الأهداف
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2 py-2.5">
            <CheckCircle2 className="size-4" />
            المهام
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2 py-2.5">
            <Paperclip className="size-4" />
            الملفات
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 py-2.5">
            <FileText className="size-4" />
            التقارير
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2 py-2.5">
            <Megaphone className="size-4" />
            الحملات
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-2 py-2.5">
            <Users className="size-4" />
            الاجتماعات
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2 py-2.5">
            <DollarSign className="size-4" />
            الفواتير
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target /> أهداف المشروع
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {resources.tasks.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="لا توجد أهداف للمشروع"
                  description="ستظهر أهداف المشروع هنا عند توفر مهام مرئية للعميل."
                />
              ) : (
                resources.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-2 rounded-md border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description ? (
                          <p className="text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        ) : null}
                      </div>
                      <Badge
                        variant={
                          task.status === TaskStatus.DONE
                            ? "default"
                            : "secondary"
                        }
                      >
                        {TASK_STATUS_AR[task.status as TaskStatus] ??
                          "غير محدد"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProjectStatusProgress
                        value={task.progress}
                        status={
                          task.status === TaskStatus.DONE
                            ? "COMPLETED"
                            : task.status === TaskStatus.IN_PROGRESS
                              ? "ACTIVE"
                              : "UPCOMING"
                        }
                        label={`نسبة إنجاز ${task.title}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {task.progress}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <TasksTab tasks={resources.tasks} focusTaskId={focusTaskId} />
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip /> ملفات المشروع
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {resources.files.length === 0 ? (
                <EmptyState
                  icon={Paperclip}
                  title="لا توجد ملفات للمشروع"
                  description="ستظهر ملفات المشروع هنا عند توفرها."
                />
              ) : (
                resources.files.map((file) => {
                  const content = (
                    <>
                      <span className="flex min-w-0 items-center gap-2">
                        <FileText className="size-4 shrink-0" />
                        <span className="truncate">{file.fileName}</span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatFileSize(file.fileSize)}
                      </span>
                    </>
                  );
                  return file.url ? (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm hover:bg-accent"
                    >
                      {content}
                    </a>
                  ) : (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm text-muted-foreground"
                    >
                      {content}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <EmptyState
            icon={FileText}
            title="لا توجد تقارير مستقلة للمشروع"
            description="التقارير متاحة للمشاريع التي تعمل بنظام الفترات."
          />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <CampaignsTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="meetings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users /> اجتماعات المشروع
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {resources.meetings.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="لا توجد اجتماعات للمشروع"
                  description="ستظهر الاجتماعات هنا عند جدولتها."
                />
              ) : (
                resources.meetings.map((meeting) => (
                  <div key={meeting.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{meeting.title}</p>
                      <Badge
                        variant={
                          meeting.status === "CANCELLED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {MEETING_STATUS_AR[meeting.status] ?? "غير محدد"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateTz(meeting.scheduledAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign /> فواتير المشروع
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {resources.invoices.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="لا توجد فواتير للمشروع"
                  description="ستظهر فواتير المشروع هنا عند إصدارها."
                />
              ) : (
                resources.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <Badge
                          variant={
                            invoice.status === "PAID" ? "default" : "secondary"
                          }
                        >
                          {invoiceStatusLabel(invoice.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        الاستحقاق: {formatDateTz(invoice.dueDate)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {fmtAmount(invoice.remainingAmount)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="size-4" />
        هذا مشروع ثابت ولا يحتوي على فترات قابلة للتبديل.
      </p>
    </div>
  );
}
