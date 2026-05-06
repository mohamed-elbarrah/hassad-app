"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ClipboardList, FileText, PenTool, PlusCircle } from "lucide-react";
import { useGetPortalRequestsQuery } from "@/features/portal/portalApi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalPageIntro } from "@/components/portal/PortalPageIntro";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { StatusBadge } from "@/components/portal/StatusBadge";

const PAGE_SIZE = 6;

function RequestSummaryPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-33 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-4 py-3">
      <p className="text-xs leading-5 text-portal-note-text">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-7 text-secondary-500">
        {value}
      </p>
    </div>
  );
}

function RequestDocumentPanel({
  title,
  description,
  href,
  actionLabel,
  icon: Icon,
}: {
  title: string;
  description: string;
  href?: string | null;
  actionLabel?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-3xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-medium text-natural-100">{title}</p>
          <p className="text-sm leading-6 text-portal-note-text">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-portal-card-border bg-natural-0">
          <Icon className="h-5 w-5 text-portal-icon" />
        </div>
      </div>

      {href && actionLabel && (
        <div className="mt-4">
          <Link href={href}>
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-4 text-sm font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500"
            >
              <Icon className="ml-2 h-4 w-4" />
              {actionLabel}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function getRequestNotesText(notes?: string | null) {
  if (!notes) {
    return null;
  }

  try {
    const parsed = JSON.parse(notes) as { description?: unknown };

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.description === "string" &&
      parsed.description.trim().length > 0
    ) {
      return parsed.description.trim();
    }
  } catch {
    // Keep backward compatibility with plain-text notes.
  }

  return notes;
}

export default function PortalRequestsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetPortalRequestsQuery({
    page,
    limit: PAGE_SIZE,
  });

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PortalPageIntro
        title="الطلبات قيد الانتظار"
        description="قبل توقيع العقد ستظهر طلباتك هنا بالحالة المبسطة. بعد التوقيع ينتقل الطلب تلقائياً إلى صفحة المشاريع كتنفيذ فعلي ضمن نفس تجربة العميل الموحدة."
        icon={ClipboardList}
        actions={
          <>
            <RequestSummaryPill label="إجمالي الطلبات" value={total} />
            <Link href="/portal/new-order">
              <Button className="h-12 rounded-2xl px-5 text-base font-medium shadow-none">
                <PlusCircle className="ml-2 h-4 w-4" />
                إنشاء طلب جديد
              </Button>
            </Link>
          </>
        }
      />

      <PortalSurfaceCard
        title="طلباتك الحالية"
        description="راجع حالة كل طلب، الخدمات المطلوبة، وآخر ما تم توفيره من عرض فني أو عقد قبل بدء التنفيذ."
        icon={ClipboardList}
      >
        {isLoading && (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="space-y-4 rounded-3xl border-[1.5px] border-portal-divider bg-portal-bg p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-7 w-48 rounded-lg" />
                    <Skeleton className="h-5 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-10 w-28 rounded-full" />
                </div>
                <Skeleton className="h-5 w-64 rounded-lg" />
                <Skeleton className="h-20 w-full rounded-3xl" />
                <div className="grid gap-3 lg:grid-cols-2">
                  <Skeleton className="h-36 w-full rounded-3xl" />
                  <Skeleton className="h-36 w-full rounded-3xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-3xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-6 text-center">
            <p className="text-base font-medium text-danger-700">
              حدث خطأ أثناء تحميل الطلبات.
            </p>
            <p className="mt-2 text-sm text-danger-600">
              يرجى المحاولة لاحقاً أو تحديث الصفحة.
            </p>
          </div>
        )}

        {!isLoading && !isError && requests.length === 0 && (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
              <ClipboardList className="h-8 w-8 text-secondary-500" />
            </div>
            <p className="text-lg font-medium text-natural-100">
              لا توجد طلبات معلقة حالياً.
            </p>
            <p className="max-w-md text-sm leading-6 text-portal-note-text">
              عند إنشاء طلب جديد سيظهر هنا مباشرة حتى يكتمل التوقيع ويصبح
              مشروعاً.
            </p>
          </div>
        )}

        {!isLoading && !isError && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((request) => {
              const noteText = getRequestNotesText(request.notes);

              return (
                <div
                  key={request.id}
                  className="rounded-3xl border-[1.5px] border-portal-card-border bg-natural-0 p-5"
                >
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b-[1.5px] border-portal-divider pb-5">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-xl font-semibold leading-8 text-natural-100">
                          {request.companyName}
                        </p>
                        <p className="text-base leading-6 text-portal-note-text">
                          {request.contactName}
                        </p>
                      </div>

                      <StatusBadge
                        status="pending"
                        label={request.statusLabel}
                      />
                    </div>

                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <p className="text-sm leading-6 text-black/70">
                        {request.stageLabel}
                      </p>
                      <p className="text-sm text-portal-note-text">
                        تاريخ الطلب:{" "}
                        {new Date(request.createdAt).toLocaleDateString(
                          "ar-SA-u-nu-latn",
                        )}
                      </p>
                    </div>

                    {noteText && (
                      <div className="rounded-3xl border-[1.5px] border-portal-divider bg-portal-bg px-4 py-4">
                        <p className="text-xs font-medium leading-5 text-portal-note-text">
                          ملخص الطلب
                        </p>
                        <p className="mt-2 text-sm leading-7 text-black/70">
                          {noteText}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-natural-100">
                        الخدمات المطلوبة
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {request.services.map((service) => (
                          <span
                            key={service.id}
                            className="rounded-full border-[1.5px] border-portal-card-border bg-portal-bg px-3 py-1.5 text-sm leading-6 text-portal-icon"
                          >
                            {service.nameAr ?? service.name}
                            {service.quantity > 1
                              ? ` × ${service.quantity}`
                              : ""}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <RequestDocumentPanel
                        title="العرض الفني"
                        description={
                          request.latestProposal
                            ? request.latestProposal.title
                            : "لم يتم نشر عرض فني بعد"
                        }
                        href={request.latestProposal?.url}
                        actionLabel={
                          request.latestProposal?.url
                            ? "مراجعة العرض"
                            : undefined
                        }
                        icon={FileText}
                      />

                      <RequestDocumentPanel
                        title="العقد"
                        description={
                          request.latestContract
                            ? request.latestContract.title
                            : "سيظهر العقد هنا عند جاهزيته"
                        }
                        href={request.latestContract?.url}
                        actionLabel={
                          request.latestContract?.url
                            ? request.latestContract.status === "SENT"
                              ? "توقيع العقد"
                              : "فتح العقد"
                            : undefined
                        }
                        icon={PenTool}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 border-t-[1.5px] border-portal-divider pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-5 text-base font-medium text-portal-icon hover:bg-badge-gray-bg disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  السابق
                </Button>
                <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg px-5 py-3 text-sm font-medium text-secondary-500">
                  {page} من {totalPages}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-5 text-base font-medium text-portal-icon hover:bg-badge-gray-bg disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  التالي
                </Button>
              </div>
            )}
          </div>
        )}
      </PortalSurfaceCard>
    </div>
  );
}
