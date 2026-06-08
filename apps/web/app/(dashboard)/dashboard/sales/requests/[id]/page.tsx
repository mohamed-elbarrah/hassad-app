"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowRight,
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
} from "lucide-react";
import { RequestStatus } from "@hassad/shared";
import {
  useGetRequestByIdQuery,
  type RequestDetail,
} from "@/features/requests/requestsApi";
import { Pill } from "@/components/design-system/Pill";
import { Skeleton } from "@/components/design-system/Skeleton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<RequestStatus, string> = {
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

const STATUS_TONE: Record<
  RequestStatus,
  import("@/components/design-system/Pill").PillTone
> = {
  [RequestStatus.SUBMITTED]: "neutral",
  [RequestStatus.QUALIFYING]: "blue",
  [RequestStatus.PROPOSAL_IN_PROGRESS]: "purple",
  [RequestStatus.PROPOSAL_SENT]: "warning",
  [RequestStatus.NEGOTIATION]: "warning",
  [RequestStatus.CONTRACT_PREPARATION]: "warning",
  [RequestStatus.CONTRACT_SENT]: "success",
  [RequestStatus.SIGNED]: "success",
  [RequestStatus.PROJECT_CREATED]: "success",
  [RequestStatus.CANCELLED]: "danger",
};

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

function InfoRow({
  icon,
  label,
  value,
  dir,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  dir?: "ltr" | "rtl";
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-neutral-300 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-neutral-300">{label}</p>
        <p
          className={cn(
            "text-sm font-medium break-all",
            dir === "ltr" && "font-mono",
          )}
          dir={dir}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-6 w-24 rounded-full mr-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
      <Skeleton className="h-36" />
    </div>
  );
}

function RelatedRecords({ request }: { request: RequestDetail }) {
  const hasProposals = request.proposals.length > 0;
  const hasContracts = request.contracts.length > 0;

  if (!hasProposals && !hasContracts && !request.project) {
    return null;
  }

  return (
    <SurfaceCard title="السجل المرتبط بالطلب" icon={FolderKanban}>
      <div className="space-y-3">
        {request.proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <FileText className="w-4 h-4 text-neutral-300 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{proposal.title}</p>
              <p className="text-xs text-neutral-300">
                عرض فني • {formatDate(proposal.createdAt)}
              </p>
            </div>
            <Pill tone="neutral">{proposal.status}</Pill>
          </div>
        ))}

        {request.contracts.map((contract) => (
          <div
            key={contract.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <FileSignature className="w-4 h-4 text-neutral-300 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{contract.title}</p>
              <p className="text-xs text-neutral-300">
                عقد • {formatDate(contract.createdAt)}
              </p>
            </div>
            <Pill tone="neutral">{contract.status}</Pill>
          </div>
        ))}

        {request.project && (
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <FolderKanban className="w-4 h-4 text-neutral-300 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{request.project.name}</p>
              <p className="text-xs text-neutral-300">
                مشروع • {formatDate(request.project.createdAt)}
              </p>
            </div>
            <Pill tone="neutral">{request.project.status}</Pill>
          </div>
        )}
      </div>
    </SurfaceCard>
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
  } = useGetRequestByIdQuery(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    const status = (error as { status?: number })?.status;
    const message =
      status === 404
        ? "لم يتم العثور على هذا الطلب."
        : status === 403
          ? "لا تملك صلاحية عرض هذا الطلب."
          : "حدث خطأ أثناء تحميل بيانات الطلب.";
    return (
      <div
        className="flex flex-col items-center justify-center py-24 gap-4"
        dir="rtl"
      >
        <StatusBanner variant="danger" title={message} />
        <Link
          href="/dashboard/sales/pipeline"
          className="text-sm text-primary underline underline-offset-2"
        >
          العودة إلى لوحة المبيعات
        </Link>
      </div>
    );
  }

  if (!request) return null;

  const { description, services } = parseNotes(request.notes);
  const selectedServices =
    request.services.length > 0
      ? request.services.map(
          (service) => service.service.nameAr || service.service.name,
        )
      : services;
  const statusLabel = STATUS_LABELS[request.status] ?? request.status;

  return (
    <div className="flex flex-col gap-6 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/sales/pipeline"
            className="p-1.5 rounded-md hover:bg-neutral-50 transition-colors shrink-0"
            title="العودة إلى لوحة المبيعات"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">
              {request.contactName}
            </h1>
            {request.companyName && (
              <p className="text-sm text-neutral-300">{request.companyName}</p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <Pill tone={STATUS_TONE[request.status]} className="text-xs h-6 px-2">
            {statusLabel}
          </Pill>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SurfaceCard title="بيانات التواصل" icon={User}>
          <div className="space-y-4">
            <InfoRow
              icon={<User className="w-4 h-4" />}
              label="الاسم"
              value={request.contactName}
            />
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="اسم الشركة"
              value={request.companyName}
            />
            <InfoRow
              icon={<Phone className="w-4 h-4" />}
              label="الجوال / واتساب"
              value={request.phoneWhatsapp}
              dir="ltr"
            />
            <InfoRow
              icon={<Mail className="w-4 h-4" />}
              label="البريد الإلكتروني"
              value={request.email}
              dir="ltr"
            />
            <InfoRow
              icon={<User className="w-4 h-4" />}
              label="مسؤول المبيعات"
              value={request.assignee?.name}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard title="بيانات النشاط" icon={Tag}>
          <div className="space-y-4">
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="اسم النشاط التجاري"
              value={request.businessName}
            />
            <InfoRow
              icon={<Tag className="w-4 h-4" />}
              label="نوع النشاط"
              value={
                request.businessType
                  ? (BUSINESS_TYPE_LABELS[request.businessType] ??
                    request.businessType)
                  : null
              }
            />
            {description && (
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-300">الوصف</p>
                  <p className="text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            )}
            {selectedServices.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-300 mb-1.5">
                    الخدمات المطلوبة
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedServices.map((service) => (
                      <Pill
                        key={service}
                        tone="neutral"
                        className="text-xs h-6 px-2"
                      >
                        {service}
                      </Pill>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="تاريخ إنشاء الطلب"
              value={formatDate(request.createdAt)}
            />
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard title="مسار حالة الطلب" icon={Calendar}>
        <ol className="relative border-r border-muted mr-2 space-y-4">
          <li className="mr-4">
            <span className="absolute -right-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-natural-0 bg-neutral-400" />
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <Pill tone="neutral" className="text-xs h-6 px-2">
                تم استلام الطلب
              </Pill>
            </div>
            <p className="text-xs text-neutral-300">
              {formatDate(request.createdAt)}
            </p>
          </li>

          {[...request.statusHistory]
            .sort(
              (a, b) =>
                new Date(a.changedAt).getTime() -
                new Date(b.changedAt).getTime(),
            )
            .map((entry) => (
              <li key={entry.id} className="mr-4">
                <span className="absolute -right-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-background bg-secondary-500" />
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  {entry.fromStatus && (
                    <Pill
                      tone={STATUS_TONE[entry.fromStatus]}
                      className="text-xs h-6 px-2"
                    >
                      {STATUS_LABELS[entry.fromStatus] ?? entry.fromStatus}
                    </Pill>
                  )}
                  {entry.fromStatus && (
                    <ArrowRight className="w-3 h-3 text-neutral-300 rotate-180" />
                  )}
                  <Pill
                    tone={STATUS_TONE[entry.toStatus]}
                    className="text-xs h-6 px-2"
                  >
                    {STATUS_LABELS[entry.toStatus] ?? entry.toStatus}
                  </Pill>
                </div>
                {entry.note && (
                  <p className="text-sm text-neutral-300 leading-relaxed mb-1">
                    {entry.note}
                  </p>
                )}
                <p className="text-xs text-neutral-300">
                  {formatDate(entry.changedAt)}
                </p>
              </li>
            ))}
        </ol>
      </SurfaceCard>

      <RelatedRecords request={request} />
    </div>
  );
}
