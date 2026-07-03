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
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { SalesDetailBreadcrumb } from "@/components/dashboard/sales/shared/SalesDetailBreadcrumb";
import { SalesDetailError } from "@/components/dashboard/sales/shared/SalesDetailError";
import { SalesDetailSkeleton } from "@/components/dashboard/sales/shared/SalesDetailSkeleton";
import { SalesStatusBadge } from "@/components/dashboard/sales/shared/SalesStatusBadge";
import { cn } from "@/lib/utils";

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
      <span className="mt-0.5 text-portal-note-text shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-portal-note-text">{label}</p>
        <p
          className={cn(
            "text-sm font-medium text-natural-100 break-all",
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
            className="flex items-start gap-3 rounded-lg border border-portal-card-border p-3"
          >
            <FileText className="w-4 h-4 text-portal-note-text mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-natural-100">
                {proposal.title}
              </p>
              <p className="text-xs text-portal-note-text">
                عرض فني • {formatDate(proposal.createdAt)}
              </p>
            </div>
            <SalesStatusBadge domain="proposal" status={proposal.status} />
          </div>
        ))}

        {request.contracts.map((contract) => (
          <div
            key={contract.id}
            className="flex items-start gap-3 rounded-lg border border-portal-card-border p-3"
          >
            <FileSignature className="w-4 h-4 text-portal-note-text mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-natural-100">
                {contract.title}
              </p>
              <p className="text-xs text-portal-note-text">
                عقد • {formatDate(contract.createdAt)}
              </p>
            </div>
            <SalesStatusBadge domain="contract" status={contract.status} />
          </div>
        ))}

        {request.project && (
          <div className="flex items-start gap-3 rounded-lg border border-portal-card-border p-3">
            <FolderKanban className="w-4 h-4 text-portal-note-text mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-natural-100">
                {request.project.name}
              </p>
              <p className="text-xs text-portal-note-text">
                مشروع • {formatDate(request.project.createdAt)}
              </p>
            </div>
            <SalesStatusBadge
              domain="project"
              status={request.project.status}
            />
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

  const { description, services } = parseNotes(request.notes);
  const selectedServices =
    request.services.length > 0
      ? request.services.map(
          (service) => service.service.nameAr || service.service.name,
        )
      : services;

  return (
    <div className="flex flex-col gap-5 max-w-4xl" dir="rtl">
      <SalesDetailBreadcrumb
        backHref="/dashboard/sales/pipeline"
        backLabel="لوحة المبيعات"
        title={contactName || companyName || "طلب"}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-natural-100 truncate">
            {contactName}
          </h1>
          {companyName && (
            <p className="text-sm text-portal-note-text">{companyName}</p>
          )}
          {client && (
            <Link
              href={`/dashboard/sales/clients/${client.id}`}
              className="text-xs text-secondary-500 hover:underline"
            >
              عرض ملف العميل
            </Link>
          )}
        </div>
        <div className="shrink-0">
          <SalesStatusBadge domain="request" status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SurfaceCard title="بيانات التواصل" icon={User}>
          <div className="space-y-4">
            <InfoRow
              icon={<User className="w-4 h-4" />}
              label="الاسم"
              value={contactName}
            />
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="اسم الشركة"
              value={companyName}
            />
            <InfoRow
              icon={<Phone className="w-4 h-4" />}
              label="الجوال / واتساب"
              value={phoneWhatsapp}
              dir="ltr"
            />
            <InfoRow
              icon={<Mail className="w-4 h-4" />}
              label="البريد الإلكتروني"
              value={email}
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
              value={businessName}
            />
            <InfoRow
              icon={<Tag className="w-4 h-4" />}
              label="نوع النشاط"
              value={
                businessType
                  ? (BUSINESS_TYPE_LABELS[businessType] ?? businessType)
                  : null
              }
            />
            {description && (
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-portal-note-text shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-portal-note-text">الوصف</p>
                  <p className="text-sm text-natural-100 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            )}
            {selectedServices.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-portal-note-text shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-portal-note-text mb-1.5">
                    الخدمات المطلوبة
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedServices.map((service) => (
                      <span
                        key={service}
                        className="inline-flex items-center rounded-full bg-badge-gray-bg px-3 py-1 text-xs font-medium text-portal-note-text"
                      >
                        {service}
                      </span>
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
              <span className="inline-flex items-center rounded-full bg-badge-gray-bg px-3 py-1 text-xs font-medium text-portal-note-text">
                تم استلام الطلب
              </span>
            </div>
            <p className="text-xs text-portal-note-text">
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
                    <SalesStatusBadge
                      domain="request"
                      status={entry.fromStatus}
                    />
                  )}
                  {entry.fromStatus && (
                    <ArrowRight className="w-3 h-3 text-portal-note-text rotate-180" />
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
                <p className="text-xs text-portal-note-text">
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
