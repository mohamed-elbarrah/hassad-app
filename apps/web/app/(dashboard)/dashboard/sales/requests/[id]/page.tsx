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
  Plus,
  PhoneCall,
  X,
} from "lucide-react";
import { ContactLogType, ContactLogResult, RequestStatus } from "@hassad/shared";
import {
  useGetRequestByIdQuery,
  useAddRequestContactLogMutation,
  useGetRequestContactLogsQuery,
} from "@/features/requests/requestsApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { InfoPanel } from "@/components/design-system/InfoPanel";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Dialog } from "@/components/design-system/Dialog";
import { Pill } from "@/components/design-system/Pill";
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

const CONTACT_TYPE_OPTIONS = [
  { value: ContactLogType.CALL, label: "اتصال هاتفي" },
  { value: ContactLogType.WHATSAPP, label: "واتساب" },
  { value: ContactLogType.MEETING, label: "اجتماع" },
  { value: ContactLogType.EMAIL, label: "بريد إلكتروني" },
];

const CONTACT_RESULT_OPTIONS = [
  { value: ContactLogResult.RESPONDED, label: "تم الرد" },
  { value: ContactLogResult.NO_RESPONSE, label: "لا رد" },
  { value: ContactLogResult.BUSY, label: "مشغول" },
  { value: ContactLogResult.WRONG_NUMBER, label: "رقم خطأ" },
  { value: ContactLogResult.NOT_INTERESTED, label: "غير مهتم" },
];

const CONTACT_TYPE_AR: Record<string, string> = {
  CALL: "اتصال هاتفي",
  WHATSAPP: "واتساب",
  MEETING: "اجتماع",
  EMAIL: "بريد إلكتروني",
};

const CONTACT_RESULT_AR: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  RESPONDED: { label: "تم الرد", tone: "success" },
  NO_RESPONSE: { label: "لا رد", tone: "warning" },
  BUSY: { label: "مشغول", tone: "warning" },
  WRONG_NUMBER: { label: "رقم خطأ", tone: "danger" },
  NOT_INTERESTED: { label: "غير مهتم", tone: "danger" },
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

function RelatedRecords({ request }: { request: any }) {
  const hasProposals = request.proposals.length > 0;
  const hasContracts = request.contracts.length > 0;

  if (!hasProposals && !hasContracts && !request.project) return null;

  return (
    <div>
      <p className="text-base font-medium text-natural-100 mb-3">
        السجل المرتبط
      </p>
      <div className="space-y-3">
        {request.proposals.map((proposal: any) => (
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

        {request.contracts.map((contract: any) => (
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

function ContactLogDialog({
  requestId,
  open,
  onOpenChange,
}: {
  requestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [addContactLog, { isLoading }] = useAddRequestContactLogMutation();
  const [type, setType] = useState<string>(ContactLogType.CALL);
  const [result, setResult] = useState<string>(ContactLogResult.RESPONDED);
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    try {
      await addContactLog({
        id: requestId,
        body: { type, result, notes: notes.trim() || undefined },
      }).unwrap();
      toast.success("تم تسجيل التواصل");
      onOpenChange(false);
      setNotes("");
    } catch {
      toast.error("فشل تسجيل التواصل");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="تسجيل تواصل"
      icon={PhoneCall}
      footer={
        <div className="flex items-center gap-2 mr-auto">
          <ActionButton variant="outline" size="md" onClick={() => onOpenChange(false)}>
            إلغاء
          </ActionButton>
          <ActionButton
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={isLoading}
          >
            تسجيل
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-natural-100 mb-2">
            نوع التواصل
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTACT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  type === opt.value
                    ? "bg-secondary-500 text-white border-secondary-500"
                    : "bg-natural-0 text-portal-icon border-portal-card-border hover:bg-badge-gray-bg"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-natural-100 mb-2">
            النتيجة
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTACT_RESULT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResult(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  result === opt.value
                    ? "bg-secondary-500 text-white border-secondary-500"
                    : "bg-natural-0 text-portal-icon border-portal-card-border hover:bg-badge-gray-bg"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-natural-100 mb-2">
            ملاحظات
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات حول التواصل..."
            className="w-full rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 py-2 text-sm text-natural-100 placeholder:text-neutral-300 outline-none resize-none h-20"
          />
        </div>
      </div>
    </Dialog>
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
  const { data: contactLogs = [] } = useGetRequestContactLogsQuery(id);
  const [contactLogOpen, setContactLogOpen] = useState(false);

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
  const companyName = client?.companyName || request.companyName;
  const phoneWhatsapp = request.phoneWhatsapp;
  const email = request.email;
  const businessName = request.businessName;
  const businessType = request.businessType;

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
        title={request.contactName || companyName || "طلب"}
      />

      {/* ── Main card ──────────────────────────────────────────────── */}
      <SurfaceCard
        title={request.contactName || "طلب"}
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

          {/* ── 5. Contact Log ───────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-natural-100">
                سجل التواصل
                {request.contactAttemptCount > 0 && (
                  <span className="mr-2 text-xs text-portal-note-text">
                    ({request.contactAttemptCount} محاولة)
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setContactLogOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-secondary-500 hover:text-secondary-600 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                تسجيل تواصل
              </button>
            </div>

            {contactLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-portal-card-border">
                <MessageSquare className="w-8 h-8 text-portal-note-text mb-2" />
                <p className="text-sm text-portal-note-text">
                  لا يوجد سجل تواصل بعد
                </p>
                <p className="text-xs text-portal-note-text mt-1">
                  سجّل أول محاولة تواصل مع العميل
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contactLogs.map((log) => {
                  const resultConfig = CONTACT_RESULT_AR[log.result] ?? {
                    label: log.result,
                    tone: "neutral" as const,
                  };
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-portal-card-border"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 shrink-0">
                        <PhoneCall className="h-4 w-4 text-secondary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-natural-100">
                            {CONTACT_TYPE_AR[log.type] ?? log.type}
                          </span>
                          <Pill tone={resultConfig.tone as any}>
                            {resultConfig.label}
                          </Pill>
                        </div>
                        {log.notes && (
                          <p className="text-sm text-portal-note-text mt-1">
                            {log.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-portal-note-text mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(log.contactedAt)}</span>
                          <span>•</span>
                          <span>{log.user.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 6. Status Timeline ───────────────────────────────────── */}
          <div>
            <p className="text-sm font-medium text-natural-100 mb-4">
              مسار حالة الطلب
            </p>
            <div className="space-y-0">
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

              {[...request.statusHistory]
                .sort(
                  (a: any, b: any) =>
                    new Date(a.changedAt).getTime() -
                    new Date(b.changedAt).getTime(),
                )
                .map((entry: any, idx: number) => {
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

          {/* ── 7. Related Records ────────────────────────────────────── */}
          <RelatedRecords request={request} />
        </div>
      </SurfaceCard>

      <ContactLogDialog
        requestId={id}
        open={contactLogOpen}
        onOpenChange={setContactLogOpen}
      />
    </div>
  );
}
