"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Phone, Mail, User, Calendar, Clock, Tag, MessageSquare } from "lucide-react";
import { PipelineStage } from "@hassad/shared";
import { useGetLeadByIdQuery } from "@/features/leads/leadsApi";
import type { LeadDetail } from "@/features/leads/leadsApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Stage labels ─────────────────────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  [PipelineStage.NEW]: "عميل جديد",
  [PipelineStage.INTRO_SENT]: "تم التواصل",
  [PipelineStage.CALL_ATTEMPT]: "محاولة اتصال",
  [PipelineStage.MEETING_SCHEDULED]: "موعد محدد",
  [PipelineStage.MEETING_DONE]: "تم الاجتماع",
  [PipelineStage.PROPOSAL_SENT]: "تم إرسال العرض",
  [PipelineStage.FOLLOW_UP]: "متابعة",
  [PipelineStage.APPROVED]: "موافقة",
  [PipelineStage.CONTRACT_SIGNED]: "توقيع عقد",
};

const STAGE_BADGE: Record<string, string> = {
  [PipelineStage.NEW]: "bg-slate-100 text-slate-700",
  [PipelineStage.INTRO_SENT]: "bg-blue-100 text-blue-700",
  [PipelineStage.CALL_ATTEMPT]: "bg-indigo-100 text-indigo-700",
  [PipelineStage.MEETING_SCHEDULED]: "bg-violet-100 text-violet-700",
  [PipelineStage.MEETING_DONE]: "bg-purple-100 text-purple-700",
  [PipelineStage.PROPOSAL_SENT]: "bg-amber-100 text-amber-700",
  [PipelineStage.FOLLOW_UP]: "bg-orange-100 text-orange-700",
  [PipelineStage.APPROVED]: "bg-yellow-100 text-yellow-700",
  [PipelineStage.CONTRACT_SIGNED]: "bg-emerald-100 text-emerald-700",
};

// ─── Contact log labels ───────────────────────────────────────────────────────
const CONTACT_TYPE_LABELS: Record<string, string> = {
  CALL: "مكالمة هاتفية",
  WHATSAPP: "واتساب",
  MEETING: "اجتماع",
  EMAIL: "بريد إلكتروني",
};

const CONTACT_RESULT_LABELS: Record<string, string> = {
  NO_RESPONSE: "لم يرد",
  RESPONDED: "رد",
  BUSY: "مشغول",
  WRONG_NUMBER: "رقم خاطئ",
};

const CONTACT_RESULT_COLOR: Record<string, string> = {
  NO_RESPONSE: "bg-slate-100 text-slate-600",
  RESPONDED: "bg-green-100 text-green-700",
  BUSY: "bg-orange-100 text-orange-700",
  WRONG_NUMBER: "bg-red-100 text-red-700",
};

// ─── Business type labels ─────────────────────────────────────────────────────
const BUSINESS_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: "مطعم",
  CAFE: "كافيه",
  RETAIL: "تجزئة",
  SERVICES: "خدمات",
  REAL_ESTATE: "عقارات",
  MEDICAL: "طبي",
  EDUCATION: "تعليم",
  OTHER: "أخرى",
};

// ─── Parse notes JSON ─────────────────────────────────────────────────────────
function parseNotes(notes?: string | null): { description: string | null; services: string[] } {
  if (!notes) return { description: null, services: [] };
  try {
    const parsed = JSON.parse(notes) as { description?: string; services?: string[] };
    return {
      description: parsed.description?.trim() || null,
      services: Array.isArray(parsed.services) ? parsed.services : [],
    };
  } catch {
    return { description: notes.trim() || null, services: [] };
  }
}

// ─── Format date ──────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

// ─── Info row ─────────────────────────────────────────────────────────────────
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
        <p className={cn("text-sm font-medium break-all", dir === "ltr" && "font-mono")} dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: lead, isLoading, isError, error } = useGetLeadByIdQuery(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    const status = (error as { status?: number })?.status;
    const message =
      status === 404
        ? "لم يتم العثور على هذا العميل المحتمل."
        : status === 403
          ? "لا تملك صلاحية عرض هذا العميل المحتمل."
          : "حدث خطأ أثناء تحميل البيانات.";
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4" dir="rtl">
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

  if (!lead) return null;

  const { description, services } = parseNotes(lead.notes);
  const stageLabel = STAGE_LABELS[lead.pipelineStage] ?? lead.pipelineStage;
  const stageBadgeClass = STAGE_BADGE[lead.pipelineStage] ?? "bg-muted text-muted-foreground";

  return (
    <div className="flex flex-col gap-6 max-w-4xl" dir="rtl">

      {/* ── Header ──────────────────────────────────────────────────── */}
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
            <h1 className="text-xl font-semibold truncate">{lead.contactName}</h1>
            {lead.companyName && (
              <p className="text-sm text-muted-foreground">{lead.companyName}</p>
            )}
          </div>
        </div>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold shrink-0",
            stageBadgeClass,
          )}
        >
          {stageLabel}
        </span>
      </div>

      {/* ── Contact + Business info ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Contact info */}
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
              value={lead.contactName}
            />
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="اسم الشركة"
              value={lead.companyName}
            />
            <InfoRow
              icon={<Phone className="w-4 h-4" />}
              label="الجوال / واتساب"
              value={lead.phoneWhatsapp}
              dir="ltr"
            />
            <InfoRow
              icon={<Mail className="w-4 h-4" />}
              label="البريد الإلكتروني"
              value={lead.email}
              dir="ltr"
            />
            {lead.assignee && (
              <InfoRow
                icon={<User className="w-4 h-4" />}
                label="المسؤول"
                value={lead.assignee.name}
              />
            )}
          </CardContent>
        </Card>

        {/* Business info */}
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
              value={lead.businessName}
            />
            <InfoRow
              icon={<Tag className="w-4 h-4" />}
              label="نوع النشاط"
              value={
                lead.businessType
                  ? (BUSINESS_TYPE_LABELS[lead.businessType] ?? lead.businessType)
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
            {services.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">الخدمات المطلوبة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {services.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="تاريخ الإنشاء"
              value={formatDate(lead.createdAt)}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Pipeline history ─────────────────────────────────────────── */}
      {lead.pipelineHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              مسار المراحل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative border-r border-muted mr-2 space-y-4">
              {[...lead.pipelineHistory]
                .sort(
                  (a, b) =>
                    new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
                )
                .map((entry) => (
                  <li key={entry.id} className="mr-4">
                    {/* Timeline dot */}
                    <span className="absolute -right-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-background bg-primary" />
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          STAGE_BADGE[entry.fromStage] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {STAGE_LABELS[entry.fromStage] ?? entry.fromStage}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground rotate-180" />
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          STAGE_BADGE[entry.toStage] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {STAGE_LABELS[entry.toStage] ?? entry.toStage}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.changedAt)}
                    </p>
                  </li>
                ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* ── Contact logs ─────────────────────────────────────────────── */}
      {lead.contactLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              سجل التواصل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...lead.contactLogs]
              .sort(
                (a, b) =>
                  new Date(b.contactedAt).getTime() - new Date(a.contactedAt).getTime(),
              )
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {CONTACT_TYPE_LABELS[log.type] ?? log.type}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          CONTACT_RESULT_COLOR[log.result] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {CONTACT_RESULT_LABELS[log.result] ?? log.result}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {log.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.contactedAt)}
                    </p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
