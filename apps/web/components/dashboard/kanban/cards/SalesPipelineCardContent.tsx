"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RequestItem } from "@/features/requests/requestsApi";
import { RequestStatus } from "@hassad/shared";
import {
  Building2,
  Clock,
  GripVertical,
  Phone,
  FileText,
  PenLine,
  History,
  PhoneCall,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

function getDealValue(request: RequestItem): number | null {
  if (request.contracts?.length) {
    const signed = request.contracts.find(
      (c) => c.totalValue && c.totalValue > 0,
    );
    if (signed) return signed.totalValue;
  }
  if (request.proposals?.length) {
    const sent = request.proposals.find(
      (p) => p.totalPrice && p.totalPrice > 0,
    );
    if (sent) return sent.totalPrice;
  }
  return null;
}

function getStalenessDays(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86_400_000,
  );
}

function getStalenessConfig(days: number) {
  if (days <= 1) return { color: "#22C55E" };
  if (days <= 3) return { color: "#EAB308" };
  if (days <= 7) return { color: "#F97316" };
  return { color: "#EF4444" };
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

interface SalesPipelineCardContentProps {
  request: RequestItem;
  onCreateProposal?: (request: RequestItem) => void;
  onEditProposal?: (request: RequestItem) => void;
  onCreateContract?: (request: RequestItem) => void;
  onEditContract?: (request: RequestItem) => void;
}

export function SalesPipelineCardContent({
  request,
  onCreateProposal,
  onEditProposal,
  onCreateContract,
  onEditContract,
}: SalesPipelineCardContentProps) {
  const router = useRouter();
  const { fmtAmount } = useCurrency();
  const dealValue = getDealValue(request);
  const staleDays = getStalenessDays(request.updatedAt);
  const staleness = getStalenessConfig(staleDays);
  const lastLog = request.contactLogs?.[0];

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/dashboard/sales/requests/${request.id}`);
  }

  return (
    <div onClick={handleClick}>
      {/* ── Deal Value ──────────────────────────────────────────────── */}
      {dealValue != null ? (
        <p className="text-sm font-bold text-natural-100 leading-tight tabular-nums mb-1.5">
          {fmtAmount(dealValue)}
        </p>
      ) : (
        <p className="text-xs text-portal-note-text leading-tight mb-1.5">
          لا يوجد عرض
        </p>
      )}

      {/* ── Header: Name + Drag Handle ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-tight truncate"
            style={{ color: "#000000" }}
          >
            {request.contactName}
          </p>
          {(request.client?.companyName || request.companyName) && (
            <div className="flex items-center gap-1 mt-1">
              <Building2
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "#A8ABB2" }}
              />
              <p className="text-xs truncate" style={{ color: "#A8ABB2" }}>
                {request.client?.companyName || request.companyName}
              </p>
            </div>
          )}

          {/* Returning client indicator */}
          {request.client?.totalProjects != null &&
            request.client.totalProjects > 0 && (
              <Link
                href={`/dashboard/sales/clients/${request.clientId}`}
                className="flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <History className="w-3 h-3" />
                {request.client.totalProjects} مشاريع سابقة
              </Link>
            )}
        </div>
        <GripVertical
          className="h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity"
          style={{ color: "#A8ABB2" }}
        />
      </div>

      {/* ── Contact Activity ────────────────────────────────────────── */}
      {request.contactAttemptCount > 0 && (
        <div
          className="flex items-center gap-1.5 text-xs mt-2"
          style={{ color: "#A8ABB2" }}
        >
          <PhoneCall className="w-3 h-3 shrink-0" />
          <span>
            {request.contactAttemptCount} محاولات
            {lastLog && (
              <>
                {" | "}
                <span
                  className={
                    lastLog.result === "RESPONDED"
                      ? "text-success-600"
                      : lastLog.result === "NOT_INTERESTED"
                        ? "text-danger-600"
                        : ""
                  }
                >
                  {lastLog.result === "NO_RESPONSE"
                    ? "لا رد"
                    : lastLog.result === "RESPONDED"
                      ? "تم الرد"
                      : lastLog.result === "BUSY"
                        ? "مشغول"
                        : lastLog.result === "WRONG_NUMBER"
                          ? "رقم خطأ"
                          : lastLog.result === "NOT_INTERESTED"
                            ? "غير مهتم"
                            : lastLog.result}
                </span>
              </>
            )}
          </span>
        </div>
      )}

      {/* ── Footer: Staleness + Phone + Last Activity ──────────────── */}
      <div className="flex items-center justify-between mt-3 pt-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: staleness.color }}
          />
          <span className="text-xs font-medium" style={{ color: staleness.color }}>
            {staleDays > 7 ? "متأخر" : formatRelativeTime(request.updatedAt)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs shrink-0">
          <Phone className="w-3.5 h-3.5" style={{ color: "#A8ABB2" }} />
          <span dir="ltr" className="truncate" style={{ color: "#A8ABB2" }}>
            {request.phoneWhatsapp}
          </span>
        </div>
      </div>

      {/* ── Pipeline Action Buttons ─────────────────────────────────── */}
      {request.status === RequestStatus.PROPOSAL_IN_PROGRESS &&
        onCreateProposal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateProposal(request);
            }}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: "#EFF6FF",
              color: "#1D4ED8",
              border: "1px solid #BFDBFE",
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            إنشاء عرض فني
          </button>
        )}

      {request.status === RequestStatus.PROPOSAL_SENT && onEditProposal && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditProposal(request);
          }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: "#FFFBEB",
            color: "#92400E",
            border: "1px solid #FDE68A",
          }}
        >
          <PenLine className="w-3.5 h-3.5" />
          تعديل العرض
        </button>
      )}

      {request.status === RequestStatus.CONTRACT_PREPARATION &&
        onCreateContract && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateContract(request);
            }}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: "#F5F3FF",
              color: "#6D28D9",
              border: "1px solid #DDD6FE",
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            إنشاء عقد
          </button>
        )}

      {request.status === RequestStatus.CONTRACT_SENT && onEditContract && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditContract(request);
          }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: "#ECFEFF",
            color: "#155E75",
            border: "1px solid #CFFAFE",
          }}
        >
          <PenLine className="w-3.5 h-3.5" />
          تعديل العقد
        </button>
      )}
    </div>
  );
}
