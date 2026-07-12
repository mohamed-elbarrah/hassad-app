"use client";

import { use } from "react";
import {
  Scale,
  Ticket,
  User,
  Building2,
  FolderKanban,
  Tag,
  Flag,
  Calendar,
  Clock,
  MessageSquare,
  Paperclip,
  Activity,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminDetailBreadcrumb } from "@/components/dashboard/admin/shared/AdminDetailBreadcrumb";
import { useGetAdminDisputeByIdQuery } from "@/features/admin/adminDisputesApi";
import {
  DISPUTE_STATUS_AR,
  DISPUTE_CATEGORY_AR,
  DISPUTE_PRIORITY_AR,
} from "@hassad/shared";
import { cn } from "@/lib/utils";

const priorityBadgeClass = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "bg-danger-100 text-danger-600 border-danger-200";
    case "HIGH":
      return "bg-alert-100 text-alert-600 border-alert-200";
    case "NORMAL":
      return "bg-primary-100 text-primary-600 border-primary-200";
    case "LOW":
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
};

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
      <Icon className="h-5 w-5 text-secondary-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-portal-note-text">{label}</p>
        <div className="text-sm font-medium text-natural-100 mt-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: dispute, isLoading, isError, refetch } =
    useGetAdminDisputeByIdQuery(id);

  if (isLoading || isError || !dispute) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <AdminDetailBreadcrumb
        backHref="/dashboard/admin/disputes"
        backLabel="النزاعات"
        title={`#${dispute.ticketNumber} - ${dispute.title}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          <SurfaceCard title="معلومات النزاع">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={Ticket} label="رقم التذكرة">
                #{dispute.ticketNumber}
              </InfoRow>
              <InfoRow icon={Tag} label="التصنيف">
                {DISPUTE_CATEGORY_AR[dispute.category as keyof typeof DISPUTE_CATEGORY_AR] || dispute.category}
              </InfoRow>
              <InfoRow icon={Flag} label="الأولوية">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    priorityBadgeClass(dispute.priority),
                  )}
                >
                  {DISPUTE_PRIORITY_AR[dispute.priority as keyof typeof DISPUTE_PRIORITY_AR] || dispute.priority}
                </span>
              </InfoRow>
              <InfoRow icon={Activity} label="الحالة">
                <AdminStatusBadge domain="dispute" status={dispute.status} />
              </InfoRow>
              <InfoRow icon={Calendar} label="تاريخ الفتح">
                {formatDate(dispute.openedAt)}
              </InfoRow>
              <InfoRow icon={Calendar} label="تاريخ الإغلاق">
                {formatDate(dispute.closedAt)}
              </InfoRow>
              {dispute.deadlineAt && (
                <InfoRow icon={Clock} label="الموعد النهائي">
                  {formatDate(dispute.deadlineAt)}
                </InfoRow>
              )}
              {dispute.resolution && (
                <InfoRow icon={CheckCircle} label="الحل">
                  {dispute.resolution}
                </InfoRow>
              )}
              {dispute.rejectionReason && (
                <InfoRow icon={AlertTriangle} label="سبب الرفض">
                  {dispute.rejectionReason}
                </InfoRow>
              )}
            </div>

            <div className="mt-4 p-4 rounded-xl border border-portal-card-border">
              <p className="text-xs text-portal-note-text mb-2">الوصف</p>
              <p className="text-sm text-natural-100 leading-relaxed whitespace-pre-wrap">
                {dispute.description}
              </p>
            </div>
          </SurfaceCard>

          {/* Messages */}
          {dispute.messages.length > 0 && (
            <SurfaceCard
              title="الرسائل"
              description={`${dispute.messages.length} رسالة`}
            >
              <div className="space-y-4">
                {dispute.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "p-4 rounded-xl border",
                      msg.isInternal
                        ? "border-alert-200 bg-alert-50/50"
                        : "border-portal-card-border",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-natural-100">
                          {msg.author.name}
                        </span>
                        {msg.isInternal && (
                          <span className="text-[10px] bg-alert-100 text-alert-600 rounded-full px-2 py-0.5 font-medium">
                            داخلي
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-portal-note-text">
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-natural-100 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* Status History */}
          {dispute.history.length > 0 && (
            <SurfaceCard
              title="سجل الحالة"
              description={`${dispute.history.length} تغيير`}
            >
              <div className="space-y-3">
                {dispute.history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-portal-card-border"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-100">
                      <Activity className="h-4 w-4 text-secondary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.fromStatus && (
                          <>
                            <AdminStatusBadge
                              domain="dispute"
                              status={entry.fromStatus}
                            />
                            <span className="text-portal-note-text">→</span>
                          </>
                        )}
                        <AdminStatusBadge
                          domain="dispute"
                          status={entry.toStatus}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-portal-note-text">
                          {entry.changer.name}
                        </span>
                        <span className="text-xs text-portal-note-text">•</span>
                        <span className="text-xs text-portal-note-text">
                          {formatDateTime(entry.changedAt)}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-natural-100 mt-2">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* Attachments */}
          {dispute.attachments.length > 0 && (
            <SurfaceCard
              title="المرفقات"
              description={`${dispute.attachments.length} ملف`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dispute.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-portal-card-border"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-100">
                      <Paperclip className="h-5 w-5 text-secondary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-natural-100 truncate">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-portal-note-text">
                        {(file.fileSize / 1024).toFixed(1)} KB •{" "}
                        {file.uploader.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <SurfaceCard title="الأطراف ذات العلاقة">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-portal-card-border">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-portal-note-text">العميل</p>
                  <p className="text-sm font-medium text-natural-100">
                    {dispute.client.companyName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-portal-card-border">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-100">
                  <User className="h-5 w-5 text-secondary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-portal-note-text">مدير المشروع</p>
                  <p className="text-sm font-medium text-natural-100">
                    {dispute.pm.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-portal-card-border">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <FolderKanban className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-portal-note-text">المشروع</p>
                  <p className="text-sm font-medium text-natural-100">
                    {dispute.project.name}
                  </p>
                </div>
              </div>

              {dispute.reviewer && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-portal-card-border">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-alert-100">
                    <User className="h-5 w-5 text-alert-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-portal-note-text">المراجع</p>
                    <p className="text-sm font-medium text-natural-100">
                      {dispute.reviewer.name}
                    </p>
                  </div>
                </div>
              )}

              {dispute.resolver && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-portal-card-border">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-100">
                    <User className="h-5 w-5 text-success-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-portal-note-text">الحلال</p>
                    <p className="text-sm font-medium text-natural-100">
                      {dispute.resolver.name}
                    </p>
                  </div>
                </div>
              )}

              {dispute.newPm && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-portal-card-border">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-alert-100">
                    <User className="h-5 w-5 text-alert-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-portal-note-text">
                      مدير المشروع الجديد
                    </p>
                    <p className="text-sm font-medium text-natural-100">
                      {dispute.newPm.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SurfaceCard>

          {/* Timeline summary */}
          <SurfaceCard title="الجدول الزمني">
            <div className="space-y-3">
              {[
                { label: "تاريخ الفتح", value: dispute.openedAt },
                { label: "تمت الموافقة", value: dispute.approvedAt },
                { label: "تاريخ الحل", value: dispute.resolvedAt },
                { label: "تاريخ الإغلاق", value: dispute.closedAt },
              ].map(
                (item) =>
                  item.value && (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-2"
                    >
                      <span className="text-xs text-portal-note-text">
                        {item.label}
                      </span>
                      <span className="text-xs font-medium text-natural-100">
                        {formatDate(item.value)}
                      </span>
                    </div>
                  ),
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
