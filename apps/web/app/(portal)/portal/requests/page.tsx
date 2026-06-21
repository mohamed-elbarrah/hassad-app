"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  PenTool,
  ExternalLink,
  Package,
  Calendar,
  Building2,
  User,
} from "lucide-react";
import { useGetPortalRequestsQuery } from "@/features/portal/portalApi";
import { Skeleton } from "@/components/design-system/Skeleton";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pagination } from "@/components/design-system/Pagination";

const PAGE_SIZE = 6;

// Helper to extract description from notes
function getRequestDescription(notes?: string | null): string | null {
  if (!notes) return null;

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(notes) as { description?: string };
    if (typeof parsed === "object" && parsed !== null) {
      // If description exists and is not empty, return it
      if (typeof parsed.description === "string" && parsed.description.trim().length > 0) {
        return parsed.description.trim();
      }
      // Description is empty or doesn't exist in JSON - return null
      return null;
    }
  } catch {
    // Not valid JSON - continue to check as plain text
  }

  // Return plain text if not empty and not JSON
  const trimmed = notes.trim();
  // Don't return if it looks like JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return null;
  }
  return trimmed || null;
}

// Format date helper
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PortalRequestsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetPortalRequestsQuery(
    {
      page,
      limit: PAGE_SIZE,
    },
    { pollingInterval: 120_000 },
  );

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-natural-100">طلباتي</h1>
        <p className="text-portal-note-text text-sm">
          متابعة طلبات الخدمات التي قمت بتقديمها. سيتم تحويل الطلب إلى مشروع بعد
          توقيع العقد.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-portal-card-border bg-natural-0 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-32 rounded-xl" />
                    <Skeleton className="h-4 w-48 rounded-xl" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
                <Skeleton className="h-16 w-full rounded-xl mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-2xl border border-danger-200 bg-danger-100/50 px-6 py-8 text-center">
            <p className="text-base font-medium text-danger-700">
              حدث خطأ أثناء تحميل الطلبات
            </p>
            <p className="mt-1 text-sm text-danger-600">
              يرجى المحاولة لاحقاً أو تحديث الصفحة
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && requests.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-portal-card-border bg-portal-bg/50 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
              <Package className="h-8 w-8 text-secondary-500" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-medium text-natural-100">
                لا توجد طلبات حالياً
              </p>
              <p className="max-w-md text-sm text-portal-note-text">
                عند إرسال طلب جديد، سيظهر هنا لمتابعة حالته حتى اكتمال التوقيع
              </p>
            </div>
          </div>
        )}

        {/* Requests List */}
        {!isLoading &&
          !isError &&
          requests.length > 0 &&
          requests.map((request) => {
            const description = getRequestDescription(request.notes);

            return (
              <div
                key={request.id}
                className="rounded-2xl border border-portal-card-border bg-natural-0 p-5"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Company Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-portal-icon" />
                      <h3 className="text-lg font-semibold text-natural-100">
                        {request.companyName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-portal-note-text">
                      <User className="h-3.5 w-3.5" />
                      <span>{request.contactName}</span>
                      <span className="text-portal-divider">|</span>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <StatusBadge
                    status="pending"
                    label={request.statusLabel}
                    className="shrink-0"
                  />
                </div>

                {/* Stage Label */}
                <p className="mt-4 text-sm text-portal-note-text leading-6">
                  {request.stageLabel}
                </p>

                {/* Description (if available) */}
                {description && (
                  <div className="mt-4 rounded-xl bg-portal-bg px-4 py-3">
                    <p className="text-sm text-natural-100/80 leading-relaxed">
                      {description}
                    </p>
                  </div>
                )}

                {/* Services */}
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {request.services.map((service) => (
                      <span
                        key={service.id}
                        className="inline-flex items-center gap-1 rounded-full border border-portal-card-border bg-portal-bg px-3 py-1 text-sm text-portal-icon"
                      >
                        <Package className="h-3 w-3" />
                        {service.nameAr ?? service.name}
                        {service.quantity > 1 && (
                          <span className="text-xs opacity-60">
                            ×{service.quantity}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-portal-divider pt-4">
                  {/* Proposal Link */}
                  {request.latestProposal?.url ? (
                    <Link
                      href={request.latestProposal.url}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-action-blue hover:text-action-blue-hover transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      عرض فني متاح
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-portal-note-text/60">
                      <FileText className="h-4 w-4" />
                      ليس هناك عرض فني بعد
                    </span>
                  )}

                  <span className="text-portal-divider">|</span>

                  {/* Contract Link */}
                  {request.latestContract?.url ? (
                    <Link
                      href={request.latestContract.url}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-action-purple hover:text-action-purple-hover transition-colors"
                    >
                      <PenTool className="h-4 w-4" />
                      {request.latestContract.status === "SENT"
                        ? "توقيع العقد"
                        : "العقد متاح"}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-portal-note-text/60">
                      <PenTool className="h-4 w-4" />
                      ليس هناك عقد بعد
                    </span>
                  )}
                </div>
              </div>
            );
          })}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
