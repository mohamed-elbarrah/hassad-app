"use client";

import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  PenTool,
  User,
} from "lucide-react";
import Link from "next/link";
import type { PortalRequestSummary } from "@/features/portal/portalApi";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { cn } from "@/lib/utils";
import {
  getRequestAction,
  getRequestActionLabel,
  getRequestStatusLabel,
  mapRequestStatusToUI,
} from "@/lib/utils/requestStatus";

interface RequestRowProps {
  request: PortalRequestSummary;
}

/**
 * Single row in the requests table. Self-contained — owns its own expand
 * state. The parent `DataTable` only knows about `renderRow` and
 * row-level data.
 *
 * Layout (RTL):
 *   [action]  [status]  [services]  [company]  [date]
 *
 * The action cell is the visual focal point — highest-priority CTAs
 * (sign contract) use the primary tone, second-priority (review proposal)
 * use outline, and "in-progress" / "completed" are muted text.
 */
export function RequestRow({ request }: RequestRowProps) {
  const [expanded, setExpanded] = useState(false);
  const action = getRequestAction(request);
  const services = request.services.map((s) => s.nameAr ?? s.name).join("، ");
  const servicesMore =
    request.services.length > 2 ? ` +${request.services.length - 2}` : "";
  const servicesPreview = request.services
    .slice(0, 2)
    .map((s) => s.nameAr ?? s.name)
    .join("، ");

  return (
    <>
      <tr
        className={cn(
          "border-b-[1.5px] border-portal-divider",
          action.kind === "sign-contract" && "bg-secondary-50/30",
        )}
      >
        {/* Action */}
        <td className="px-5 py-4">
          <RequestActionCell action={action} />
        </td>

        {/* Status */}
        <td className="px-5 py-4">
          <StatusBadge
            status={mapRequestStatusToUI(request.status)}
            label={getRequestStatusLabel(request.status)}
          />
        </td>

        {/* Services (truncated cell) */}
        <td className="px-5 py-4 text-sm text-portal-note-text">
          <span title={services}>{servicesPreview}</span>
          {servicesMore && (
            <span className="text-xs text-neutral-300"> {servicesMore}</span>
          )}
        </td>

        {/* Company + contact */}
        <td className="px-5 py-4">
          <div className="flex flex-col">
            <span
              className="text-sm font-medium text-natural-100 truncate max-w-[200px]"
              title={request.companyName}
            >
              {request.companyName}
            </span>
            <span className="flex items-center gap-1 text-xs text-portal-note-text">
              <User className="size-3 shrink-0" />
              <span className="truncate" title={request.contactName}>
                {request.contactName}
              </span>
            </span>
          </div>
        </td>

        {/* Date */}
        <td className="px-5 py-4">
          <span className="flex items-center gap-1.5 text-sm text-portal-note-text">
            <Calendar className="size-3.5 shrink-0" />
            <time dateTime={request.createdAt}>
              {new Date(request.createdAt).toLocaleDateString(
                "ar-SA-u-nu-latn",
              )}
            </time>
          </span>
        </td>

        {/* Expand toggle */}
        <td className="px-3 py-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-portal-icon transition-colors hover:bg-badge-gray-bg hover:text-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/30"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </button>
        </td>
      </tr>

      {/* Expanded detail row — colspan'd across all columns */}
      {expanded && (
        <tr className="bg-portal-bg/40">
          <td colSpan={6} className="px-5 py-5">
            <RequestDetail request={request} />
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * The action cell. Centralized so the CTA hierarchy (primary → outline →
 * muted) stays consistent across rows.
 */
function RequestActionCell({
  action,
}: {
  action: ReturnType<typeof getRequestAction>;
}) {
  switch (action.kind) {
    case "sign-contract":
      return (
        <ActionButton
          href={action.href}
          variant="primary"
          size="sm"
          icon={<PenTool className="size-3.5" />}
          className="h-8 rounded-lg px-3 text-xs"
        >
          {getRequestActionLabel(action)}
        </ActionButton>
      );
    case "review-proposal":
      return (
        <ActionButton
          href={action.href}
          variant="outline"
          size="sm"
          icon={<FileText className="size-3.5" />}
          className="h-8 rounded-lg border border-portal-card-border bg-white px-3 text-xs"
        >
          {getRequestActionLabel(action)}
        </ActionButton>
      );
    case "in-progress":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-portal-note-text">
          <Clock className="size-3.5" />
          {getRequestActionLabel(action)}
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
          <CheckCircle2 className="size-3.5" />
          {getRequestActionLabel(action)}
        </span>
      );
  }
}

/**
 * Expandable detail row content — shows everything that didn't fit in the
 * row: full description, all services, document links, and the stage
 * message.
 */
function RequestDetail({ request }: { request: PortalRequestSummary }) {
  const services = request.services;
  const description = getRequestDescription(request.notes);

  return (
    <div className="grid gap-4 md:grid-cols-2" dir="rtl">
      {/* Stage message from backend */}
      <div className="space-y-2 md:col-span-2">
        <p className="text-xs font-medium text-portal-note-text">
          {request.status === "SIGNED"
            ? "تم توقيع العقد وتحويل الطلب إلى مشروع."
            : "حالة الطلب"}
        </p>
        <p className="text-sm text-natural-100/80 leading-relaxed">
          {request.stageLabel}
        </p>
        {description && (
          <div className="rounded-xl bg-natural-0 px-4 py-3">
            <p className="text-xs font-medium text-portal-note-text mb-1">
              ملاحظاتك
            </p>
            <p className="text-sm text-natural-100/80 leading-relaxed">
              {description}
            </p>
          </div>
        )}
      </div>

      {/* Services list (full) */}
      {services.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-portal-note-text">
            الخدمات المطلوبة ({services.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full border border-portal-card-border bg-natural-0 px-3 py-1 text-xs text-natural-100"
              >
                <FileText className="size-3 text-portal-icon" />
                {s.nameAr ?? s.name}
                {s.quantity > 1 && (
                  <span className="text-[10px] opacity-60">×{s.quantity}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Documents (proposal + contract) */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-portal-note-text">المستندات</p>
        <div className="flex flex-wrap gap-3">
          {request.latestProposal?.url ? (
            <Link
              href={request.latestProposal.url}
              className="inline-flex items-center gap-1.5 rounded-lg border border-portal-card-border bg-natural-0 px-3 py-1.5 text-xs font-medium text-action-blue hover:bg-badge-gray-bg transition-colors"
            >
              <FileText className="size-3.5" />
              عرض فني
              <ExternalLink className="size-3" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-portal-note-text/60">
              <FileText className="size-3.5" />
              لا يوجد عرض فني بعد
            </span>
          )}
          {request.latestContract?.url ? (
            <Link
              href={request.latestContract.url}
              className="inline-flex items-center gap-1.5 rounded-lg border border-portal-card-border bg-natural-0 px-3 py-1.5 text-xs font-medium text-action-purple hover:bg-badge-gray-bg transition-colors"
            >
              <PenTool className="size-3.5" />
              {request.latestContract.status === "SENT"
                ? "توقيع العقد"
                : "العقد"}
              <ExternalLink className="size-3" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-portal-note-text/60">
              <PenTool className="size-3.5" />
              لا يوجد عقد بعد
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Extract a human description from a possibly-JSON `notes` string.
 *  Mirrors the same logic that used to live in the page. Kept here so the
 *  detail renderer doesn't import private helpers from the page. */
function getRequestDescription(notes?: string | null): string | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as { description?: string };
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.description === "string" &&
      parsed.description.trim().length > 0
    ) {
      return parsed.description.trim();
    }
    return null;
  } catch {
    const trimmed = notes.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return null;
    return trimmed || null;
  }
}

// Re-export so consumers don't import from two places.
export { getRequestDescription };
