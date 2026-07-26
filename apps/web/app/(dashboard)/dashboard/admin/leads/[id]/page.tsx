"use client";

import { use } from "react";
import {
  Building2,
  User,
  Mail,
  Phone,
  Store,
  Globe,
  UserCircle,
  Target,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminLeadByIdQuery } from "@/features/admin/adminLeadsApi";
import { CLIENT_SOURCE_AR, BUSINESS_TYPE_AR } from "@hassad/shared";

const CONTACT_LOG_TYPE_AR: Record<string, string> = {
  CALL: "اتصال هاتفي",
  WHATSAPP: "واتساب",
  MEETING: "اجتماع",
  EMAIL: "بريد إلكتروني",
};



export default function LeadOverviewTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: lead } = useGetAdminLeadByIdQuery(id);

  if (!lead) return null;

  return (
    <div className="space-y-5">
      <SurfaceCard title="معلومات العميل المتوقع">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard
            icon={Building2}
            label="اسم الشركة"
            value={lead.companyName}
          />
          <InfoCard icon={User} label="جهة الاتصال" value={lead.contactName} />
          <InfoCard
            icon={Mail}
            label="البريد الإلكتروني"
            value={lead.email || "—"}
          />
          <InfoCard
            icon={Phone}
            label="رقم الجوال"
            value={lead.phoneWhatsapp}
          />
          <InfoCard
            icon={Store}
            label="النشاط التجاري"
            value={
              BUSINESS_TYPE_AR[
                lead.businessType as keyof typeof BUSINESS_TYPE_AR
              ] || lead.businessType
            }
          />
          <InfoCard
            icon={Globe}
            label="المصدر"
            value={
              CLIENT_SOURCE_AR[lead.source as keyof typeof CLIENT_SOURCE_AR] ||
              lead.source
            }
          />
          <InfoCard
            icon={Target}
            label="المرحلة"
            value={
              <AdminStatusBadge domain="lead" status={lead.pipelineStage} />
            }
          />
          <InfoCard
            icon={UserCircle}
            label="المسؤول"
            value={lead.assignee?.name || lead.assignedTo || "—"}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard title="تفاصيل إضافية">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <p className="text-2xl font-semibold text-natural-100">
              {lead.contactAttemptCount}
            </p>
            <p className="text-xs text-portal-note-text mt-1">
              محاولات التواصل
            </p>
          </div>
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <p className="text-2xl font-semibold text-natural-100">
              {lead.lastContactAt
                ? new Date(lead.lastContactAt).toLocaleDateString("ar-SA")
                : "—"}
            </p>
            <p className="text-xs text-portal-note-text mt-1">آخر تواصل</p>
          </div>
        </div>
      </SurfaceCard>

      {lead.notes && (
        <SurfaceCard title="ملاحظات">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <FileText className="h-5 w-5 text-secondary-500 mt-0.5 shrink-0" />
            <p className="text-sm text-natural-100 whitespace-pre-wrap">
              {lead.notes}
            </p>
          </div>
        </SurfaceCard>
      )}

      {lead.contactLogs.length > 0 && (
        <SurfaceCard title="سجل التواصل">
          <div className="space-y-3">
            {lead.contactLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 shrink-0">
                  <Clock className="h-4 w-4 text-secondary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-natural-100">
                      {CONTACT_LOG_TYPE_AR[log.type] || log.type}
                    </span>
                    <AdminStatusBadge domain="lead" status={log.result} />
                  </div>
                  {log.notes && (
                    <p className="text-sm text-portal-note-text mt-1">
                      {log.notes}
                    </p>
                  )}
                  <p className="text-xs text-portal-note-text mt-1">
                    {new Date(log.contactedAt).toLocaleDateString("ar-SA", {
                      dateStyle: "medium",
                    })}{" "}
                    — {log.user.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      <SurfaceCard title="معلومات إضافية">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard
            icon={Calendar}
            label="تاريخ الإنشاء"
            value={new Date(lead.createdAt).toLocaleDateString("ar-SA")}
          />
          <InfoCard
            icon={Calendar}
            label="آخر تحديث"
            value={new Date(lead.updatedAt).toLocaleDateString("ar-SA")}
          />
        </div>
      </SurfaceCard>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
      <Icon className="h-5 w-5 text-secondary-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-portal-note-text">{label}</p>
        <div className="text-sm font-medium text-natural-100 mt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
}
