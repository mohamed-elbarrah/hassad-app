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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

const STATUS_BADGE: Record<RequestStatus, string> = {
  [RequestStatus.SUBMITTED]: "bg-slate-100 text-slate-700",
  [RequestStatus.QUALIFYING]: "bg-blue-100 text-blue-700",
  [RequestStatus.PROPOSAL_IN_PROGRESS]: "bg-violet-100 text-violet-700",
  [RequestStatus.PROPOSAL_SENT]: "bg-amber-100 text-amber-700",
  [RequestStatus.NEGOTIATION]: "bg-orange-100 text-orange-700",
  [RequestStatus.CONTRACT_PREPARATION]: "bg-yellow-100 text-yellow-700",
  [RequestStatus.CONTRACT_SENT]: "bg-lime-100 text-lime-700",
  [RequestStatus.SIGNED]: "bg-emerald-100 text-emerald-700",
  [RequestStatus.PROJECT_CREATED]: "bg-teal-100 text-teal-700",
  [RequestStatus.CANCELLED]: "bg-rose-100 text-rose-700",
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
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
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
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
      <Skeleton className="h-36 rounded-xl" />
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-muted-foreground" />
          السجل المرتبط بالطلب
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {request.proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{proposal.title}</p>
              <p className="text-xs text-muted-foreground">
                عرض فني • {formatDate(proposal.createdAt)}
              </p>
            </div>
            <Badge variant="outline">{proposal.status}</Badge>
          </div>
        ))}

        {request.contracts.map((contract) => (
          <div
            key={contract.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <FileSignature className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{contract.title}</p>
              <p className="text-xs text-muted-foreground">
                عقد • {formatDate(contract.createdAt)}
              </p>
            </div>
            <Badge variant="outline">{contract.status}</Badge>
          </div>
        ))}

        {request.project && (
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <FolderKanban className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{request.project.name}</p>
              <p className="text-xs text-muted-foreground">
                مشروع • {formatDate(request.project.createdAt)}
              </p>
            </div>
            <Badge variant="secondary">{request.project.status}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
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
        <p className="text-destructive font-medium">{message}</p>
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
  const statusBadgeClass =
    STATUS_BADGE[request.status] ?? "bg-muted text-muted-foreground";

  return (
    <div className="flex flex-col gap-6 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/sales/pipeline"
            className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
            title="العودة إلى لوحة المبيعات"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">
              {request.contactName}
            </h1>
            {request.companyName && (
              <p className="text-sm text-muted-foreground">
                {request.companyName}
              </p>
            )}
          </div>
        </div>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold shrink-0",
            statusBadgeClass,
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              بيانات التواصل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              بيانات النشاط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">الوصف</p>
                  <p className="text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            )}
            {selectedServices.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    الخدمات المطلوبة
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedServices.map((service) => (
                      <Badge
                        key={service}
                        variant="secondary"
                        className="text-xs"
                      >
                        {service}
                      </Badge>
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            مسار حالة الطلب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative border-r border-muted mr-2 space-y-4">
            <li className="mr-4">
              <span className="absolute -right-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-background bg-slate-400" />
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  تم استلام الطلب
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
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
                  <span className="absolute -right-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-background bg-primary" />
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    {entry.fromStatus && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          STATUS_BADGE[entry.fromStatus] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {STATUS_LABELS[entry.fromStatus] ?? entry.fromStatus}
                      </span>
                    )}
                    {entry.fromStatus && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground rotate-180" />
                    )}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        STATUS_BADGE[entry.toStatus] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {STATUS_LABELS[entry.toStatus] ?? entry.toStatus}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                      {entry.note}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.changedAt)}
                  </p>
                </li>
              ))}
          </ol>
        </CardContent>
      </Card>

      <RelatedRecords request={request} />
    </div>
  );
}
