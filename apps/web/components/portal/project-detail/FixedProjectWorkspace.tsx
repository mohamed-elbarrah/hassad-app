"use client";

import { Calendar, DollarSign, FileText, Paperclip, Users } from "lucide-react";
import { DELIVERABLE_STATUS_AR, DeliverableStatus } from "@hassad/shared";
import type {
  PortalProjectDetail,
  PortalProjectWorkspace,
} from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "./EmptyState";
import { CampaignsTab } from "./CampaignsTab";
import { formatDateTz, formatFileSize, formatShortDate } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { portalProjectStatusLabel } from "@/lib/i18n";
import { ProjectStatusProgress } from "@/components/portal/shared/ProjectStatusProgress";

interface FixedProjectWorkspaceProps {
  project: PortalProjectDetail;
  resources: NonNullable<PortalProjectWorkspace["resources"]>;
}

export function FixedProjectWorkspace({
  project,
  resources,
}: FixedProjectWorkspaceProps) {
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

      <div className="grid gap-6 lg:grid-cols-2">
        <CampaignsTab projectId={project.id} />

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText /> مخرجات المشروع
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {resources.deliverables.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="لا توجد مخرجات للمشروع"
                description="ستظهر المخرجات هنا عند توفرها."
              />
            ) : (
              resources.deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="flex flex-col gap-1 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{deliverable.title}</p>
                    <Badge variant="secondary">
                      {DELIVERABLE_STATUS_AR[
                        deliverable.status as DeliverableStatus
                      ] ?? "غير محدد"}
                    </Badge>
                  </div>
                  {deliverable.description ? (
                    <p className="text-sm text-muted-foreground">
                      {deliverable.description}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatDateTz(deliverable.createdAt)}
                  </p>
                  {deliverable.url ? (
                    <a
                      href={deliverable.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                      تحميل الملف
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

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
                  <p className="font-medium">{meeting.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDateTz(meeting.scheduledAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

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
                    <p className="font-medium">{invoice.invoiceNumber}</p>
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
      </div>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="size-4" />
        هذا مشروع ثابت ولا يحتوي على فترات قابلة للتبديل.
      </p>
    </div>
  );
}
