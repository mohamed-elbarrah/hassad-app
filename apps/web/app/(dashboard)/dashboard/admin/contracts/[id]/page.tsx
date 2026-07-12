"use client";

import { use } from "react";
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  BadgeCheck,
  User,
  FolderKanban,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminContractByIdQuery } from "@/features/admin/adminContractsApi";

const CONTRACT_TYPE_AR: Record<string, string> = {
  MONTHLY_RETAINER: "اشتراك شهري",
  FIXED_PROJECT: "مشروع ثابت",
  ONE_TIME_SERVICE: "خدمة لمرة واحدة",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ar-SA");
}

export default function ContractOverviewTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: contract } = useGetAdminContractByIdQuery(id);

  if (!contract) return null;

  return (
    <div className="space-y-5">
      <SurfaceCard title="معلومات العقد">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <FileText className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">العنوان</p>
              <p className="text-sm font-medium text-natural-100">
                {contract.title}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Building2 className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">العميل</p>
              <p className="text-sm font-medium text-natural-100">
                {contract.client.companyName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <FileText className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">النوع</p>
              <p className="text-sm font-medium text-natural-100">
                {CONTRACT_TYPE_AR[contract.type] || contract.type}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <BadgeCheck className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">الحالة</p>
              <div className="mt-1">
                <AdminStatusBadge domain="contract" status={contract.status} />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">تاريخ البداية</p>
              <p className="text-sm font-medium text-natural-100">
                {formatDate(contract.startDate)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">تاريخ النهاية</p>
              <p className="text-sm font-medium text-natural-100">
                {formatDate(contract.endDate)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <DollarSign className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">القيمة الشهرية</p>
              <p className="text-sm font-medium text-natural-100">
                {contract.monthlyValue > 0
                  ? formatCurrency(contract.monthlyValue)
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <DollarSign className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">القيمة الإجمالية</p>
              <p className="text-sm font-medium text-natural-100">
                {formatCurrency(contract.totalValue)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <BadgeCheck className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">توقيع إلكتروني</p>
              <p className="text-sm font-medium text-natural-100">
                {contract.eSigned ? "موقّع" : "غير موقّع"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">تاريخ التوقيع</p>
              <p className="text-sm font-medium text-natural-100">
                {formatDate(contract.signedAt)}
              </p>
            </div>
          </div>
          {contract.numberOfMonths && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">عدد الأشهر</p>
                <p className="text-sm font-medium text-natural-100">
                  {contract.numberOfMonths}
                </p>
              </div>
            </div>
          )}
          {contract.downPaymentType && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <DollarSign className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">الدفعة المقدمة</p>
                <p className="text-sm font-medium text-natural-100">
                  {contract.downPaymentType === "PERCENTAGE"
                    ? `${contract.downPaymentValue}%`
                    : contract.downPaymentValue
                      ? formatCurrency(contract.downPaymentValue)
                      : "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      </SurfaceCard>

      {contract.project && (
        <SurfaceCard title="المشروع المرتبط">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <FolderKanban className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">المشروع</p>
                <p className="text-sm font-medium text-natural-100">
                  {contract.project.name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <BadgeCheck className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">حالة المشروع</p>
                <div className="mt-1">
                  <AdminStatusBadge
                    domain="project"
                    status={contract.project.status}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <User className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">مدير المشروع</p>
                <p className="text-sm font-medium text-natural-100">
                  {contract.project.manager.name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">تاريخ البداية</p>
                <p className="text-sm font-medium text-natural-100">
                  {formatDate(contract.project.startDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">تاريخ النهاية</p>
                <p className="text-sm font-medium text-natural-100">
                  {formatDate(contract.project.endDate)}
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>
      )}

      {contract.versions && contract.versions.length > 0 && (
        <SurfaceCard title="إصدارات العقد">
          <div className="space-y-2">
            {contract.versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-3 rounded-xl border border-portal-card-border"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-secondary-500" />
                  <span className="text-sm font-medium text-natural-100">
                    الإصدار {version.versionNumber}
                  </span>
                </div>
                <span className="text-xs text-portal-note-text">
                  {formatDate(version.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
