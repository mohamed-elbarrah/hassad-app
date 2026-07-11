"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Phone,
  Mail,
  User,
  Calendar,
  Tag,
  MessageSquare,
  FileSignature,
  FileText,
  FolderKanban,
  Copy,
  CheckCheck,
  ExternalLink,
  Clock,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import { RequestStatus } from "@hassad/shared";
import {
  useGetRequestByIdQuery,
  type RequestDetail,
} from "@/features/requests/requestsApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { InfoPanel } from "@/components/design-system/InfoPanel";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SalesDetailBreadcrumb } from "@/components/dashboard/sales/shared/SalesDetailBreadcrumb";
import { SalesDetailError } from "@/components/dashboard/sales/shared/SalesDetailError";
import { SalesDetailSkeleton } from "@/components/dashboard/sales/shared/SalesDetailSkeleton";
import { SalesStatusBadge } from "@/components/dashboard/sales/shared/SalesStatusBadge";
import { toast } from "sonner";

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: "مطعم",
  CLINIC: "عيادة",
  STORE: "متجر",
  SERVICE: "خدمات",
  CAFE: "كافيه",
  RETAIL: "تجزئة",
  SERVICES: "خدمات",
  REAL_ESTATE: "عقارات",
  MEDICAL: "طبي",
  EDUCATION: "تعليم",
  OTHER: "أخرى",
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "الموقع الإلكتروني",
  REFERRAL: "توصية",
  SOCIAL_MEDIA: "تواصل اجتماعي",
  CALL: "اتصال هاتفي",
  WALK_IN: "زيارة",
  OTHER: "أخرى",
};

const STATUS_LABELS: Record<string, string> = {
  [RequestStatus.SUBMITTED]: "طلب جديد",
  [RequestStatus.QUALIFYING]: "مراجعة المبيعات",
  [RequestStatus.PROPOSAL_IN_PROGRESS]: "إعداد العرض",
  [RequestStatus.PROPOSAL_SENT]: "تم إرسال العرض",
  [RequestStatus.NEGOTIATION]: "تفاوض",
  [RequestStatus.CONTRACT_PREPARATION]: "إعداد العقد",
  [RequestStatus.CONTRACT_SENT]: "العقد مرسل",
  [RequestStatus.SIGNED]: "تم التوقيع",
  [RequestStatus.PROJECT_CREATED]: "تحول إلى مشروع",
  [RequestStatus.CANCELLED]: "ملغي",
};

function parseNotes(notes?: string | null): {
  description: string | null;
  services: string[];
} {
  if (!notes) return { description: null, services: [] };
  try {
    const parsed = JSON.parse(notes) as {
      description?: string;
      services?: string[];
    };
    return {
      description: parsed.description?.trim() || null,
      services: Array.isArray(parsed.services) ? parsed.services : [],
    };
  } catch {
    return { description: notes.trim() || null, services: [] };
  }
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`تم نسخ ${label}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذر النسخ");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-portal-note-text hover:text-secondary-500 transition-colors"
      title={`نسخ ${label}`}
    >
      {copied ? (
        <CheckCheck className="w-3 h-3 text-success-600" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}

function RelatedRecords({ request }: { request: RequestDetail }) {
  const hasProposals = request.proposals.length > 0;
  const hasContracts = request.contracts.length > 0;

  if (!hasProposals && !hasContracts && !request.project) return null;

  return (
    <div>
      <p className="text-base font-medium text-natural-100 mb-3">
        السجل المرتبط
      </p>
      <div className="space-y-3">
        {request.proposals.map((proposal) => (
          <Link
            key={proposal.id}
            href={`/dashboard/sales/proposals`}
            className="flex items-center gap-3 rounded-xl border-[1.5px] border-portal-card-border bg-portal-bg p-3 hover:bg-badge-gray-bg transition-colors group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-action-blue-soft">
              <FileText className="h-5 w-5 text-action-blue" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-natural-100 truncate group-hover:text-secondary-500 transition-colors">
                {proposal.title}
              </p>
              <p className="text-xs text-portal-note-text">
                {formatShortDate(proposal.createdAt)}
              </p>
            </div>
            <SalesStatusBadge domain="proposal" status={proposal.status} />
            <ArrowLeft className="w-4 h-4 text-portal-note-text shrink-0 group-hover:-translate-x-1 transition-transform" />
          </Link>
        ))}

        {request.contracts.map((contract) => (
          <Link
            key={contract.id}
            href={`/dashboard/sales/contracts/${contract.id}`}
            className="flex items-center gap-3 rounded-xl border-[1.5px] border-portal-card-border bg-portal-bg p-3 hover:bg-badge-gray-bg transition-colors group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-100">
              <FileSignature className="h-5 w-5 text-success-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-natural-100 truncate group-hover:text-secondary-500 transition-colors">
                {contract.title}
              </p>
              <p className="text-xs text-portal-note-text">
                {formatShortDate(contract.createdAt)}
              </p>
            </div>
            <SalesStatusBadge domain="contract" status={contract.status} />
            <ArrowLeft className="w-4 h-4 text-portal-note-text shrink-0 group-hover:-translate-x-1 transition-transform" />
          </Link>
        ))}

        {request.project && (
          <Link
            href={`/dashboard/pm/projects/${request.project.id}`}
            className="flex items-center gap-3 rounded-xl border-[1.5px] border-portal-card-border bg-portal-bg p-3 hover:bg-badge-gray-bg transition-colors group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-action-purple-soft">
              <FolderKanban className="h-5 w-5 text-action-purple" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-natural-100 truncate group-hover:text-secondary-500 transition-colors">
                {request.project.name}
              </p>
              <p className="text-xs text-portal-note-text">
                {formatShortDate(request.project.createdAt)}
              </p>
            </div>
            <SalesStatusBadge
              domain="project"
              status={request.project.status}
            />
            <ArrowLeft className="w-4 h-4 text-portal-note-text shrink-0 group-hover:-translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: request,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetRequestByIdQuery(id);

  if (isLoading) return <SalesDetailSkeleton variant="request" />;

  if (isError) {
    const status = (error as { status?: number })?.status;
    const title =
      status === 404
        ? "لم يتم العثور على هذا الطلب."
        : status === 403
          ? "لا تملك صلاحية عرض هذا الطلب."
          : "حدث خطأ أثناء تحميل بيانات الطلب.";
    return (
      <SalesDetailError
        title={title}
        onRetry={refetch}
        backHref="/dashboard/sales/pipeline"
        backLabel="لوحة المبيعات"
      />
    );
  }

  if (!request) return null;

  const client = request.client;
  const contactName = client?.contactName || request.contactName;
  const companyName = client?.companyName || request.companyName;
  const phoneWhatsapp = client?.phoneWhatsapp || request.phoneWhatsapp;
  const email = client?.email || request.email;
  const businessName = client?.businessName || request.businessName;
  const businessType = client?.businessType || request.businessType;

  const { description } = parseNotes(request.notes);
  const selectedServices =
    request.services.length > 0
      ? request.services.map(
          (service) => service.service.nameAr || service.service.name,
        )
      : [];

  return (
    <div className="flex flex-col gap-5 max-w-4xl" dir="rtl">
      <SalesDetailBreadcrumb
        backHref="/dashboard/sales/pipeline"
        backLabel="لوحة المبيعات"
        title={contactName || companyName || "طلب"}
      />

      {/* ── Main card — everything inside ─────────────────────────────── */}
      <SurfaceCard
        title={contactName || "طلب"}
        icon={User}
        action={<SalesStatusBadge domain="request" status={request.status} />}
      >
        <div className="space-y-6">
          {/* ── 1. Client Identity ──────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {companyName && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-portal-note-text shrink-0" />
                <span className="text-sm font-medium text-natural-100">
                  {companyName}
                </span>
                {client && (
                  <Link
                    href={`/dashboard/sales/clients/${client.id}`}
                    className="inline-flex items-center gap-1 text-xs text-secondary-500 hover:underline mr-auto"
                  >
                    <ExternalLink className="w-3 h-3" />
                    ملف العميل
                  </Link>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {phoneWhatsapp && (
                <div className="flex items-center gap-1.5 text-sm" dir="ltr">
                  <Phone className="w-4 h-4 text-portal-note-text shrink-0" />
                  <span className="font-mono text-natural-100">
                    {phoneWhatsapp}
                  </span>
                  <CopyButton value={phoneWhatsapp} label="رقم الهاتف" />
                </div>
              )}
              {email && (
                <div className="flex items-center gap-1.5 text-sm" dir="ltr">
                  <Mail className="w-4 h-4 text-portal-note-text shrink-0" />
                  <span className="font-mono text-portal-note-text">
                    {email}
                  </span>
                  <CopyButton value={email} label="البريد الإلكتروني" />
                </div>
              )}
            </div>

            {(businessName || businessType) && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-portal-note-text">
                {businessName && (
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {businessName}
                  </span>
                )}
                {businessType && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {BUSINESS_TYPE_LABELS[businessType] ?? businessType}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── 2. Key Metrics ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoPanel variant="default" title="الحالة الحالية">
              <p className="text-sm font-semibold text-natural-100">
                {STATUS_LABELS[request.status] ?? request.status}
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="مسؤول المبيعات">
              <p className="text-sm font-semibold text-natural-100">
                {request.assignee?.name ?? "غير معين"}
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="تاريخ الطلب">
              <p className="text-sm font-semibold text-natural-100">
                {formatShortDate(request.createdAt)}
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="المصدر">
              <p className="text-sm font-semibold text-natural-100">
                {SOURCE_LABELS[request.source] ?? request.source}
              </p>
            </InfoPanel>
          </div>

          {/* ── 3. Services Requested ────────────────────────────────── */}
          {selectedServices.length > 0 && (
            <div>
              <p className="text-sm font-medium text-natural-100 mb-3">
                الخدمات المطلوبة
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((service) => (
                  <span
                    key={service}
                    className="inline-flex items-center gap-1.5 rounded-full bg-badge-gray-bg px-3 py-1.5 text-xs font-medium text-natural-100"
                  >
                    <Tag className="w-3 h-3 text-portal-note-text" />
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. Description ────────────────────────────────────────── */}
          {description && (
            <InfoPanel
              variant="bordered"
              title="وصف الطلب"
              description="ملاحظات العميل حول احتياجه"
            >
              <p className="text-sm text-natural-100 leading-relaxed">
                {description}
              </p>
            </InfoPanel>
          )}

          {/* ── 5. Status Timeline ───────────────────────────────────── */}
          <div>
            <p className="text-sm font-medium text-natural-100 mb-4">
              مسار حالة الطلب
            </p>
            <div className="space-y-0">
              {/* First step — request creation */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full border-2 border-portal-card-border bg-natural-0 shrink-0 mt-1" />
                  <div className="w-0.5 flex-1 bg-portal-divider min-h-[24px]" />
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center rounded-full bg-badge-gray-bg px-2.5 py-0.5 text-xs font-medium text-portal-note-text">
                      تم استلام الطلب
                    </span>
                  </div>
                  <p className="text-xs text-portal-note-text">
                    {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>

              {/* Status history steps */}
              {[...request.statusHistory]
                .sort(
                  (a, b) =>
                    new Date(a.changedAt).getTime() -
                    new Date(b.changedAt).getTime(),
                )
                .map((entry, idx) => {
                  const isLast = idx === request.statusHistory.length - 1;
                  return (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-secondary-500 shrink-0 mt-1" />
                        {!isLast && (
                          <div className="w-0.5 flex-1 bg-portal-divider min-h-[24px]" />
                        )}
                      </div>
                      <div className={`${isLast ? "" : "pb-6"} flex-1 min-w-0`}>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {entry.fromStatus && (
                            <>
                              <SalesStatusBadge
                                domain="request"
                                status={entry.fromStatus}
                              />
                              <ArrowLeft className="w-3 h-3 text-portal-note-text shrink-0" />
                            </>
                          )}
                          <SalesStatusBadge
                            domain="request"
                            status={entry.toStatus}
                          />
                        </div>
                        {entry.note && (
                          <p className="text-sm text-portal-note-text leading-relaxed mb-1">
                            {entry.note}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-portal-note-text">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(entry.changedAt)}</span>
                          {entry.changer?.name && (
                            <>
                              <span>•</span>
                              <UserCheck className="w-3 h-3" />
                              <span>{entry.changer.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ── 6. Related Records ────────────────────────────────────── */}
          <RelatedRecords request={request} />
        </div>
      </SurfaceCard>
    </div>
  );
}
