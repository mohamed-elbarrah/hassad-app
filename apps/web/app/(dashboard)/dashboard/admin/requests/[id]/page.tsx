"use client";

import { use } from "react";
import {
  Building2,
  User,
  Phone,
  Mail,
  Briefcase,
  Tag,
  FileText,
  UserCircle,
  Calendar,
  Clock,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminRequestByIdQuery } from "@/features/admin/adminRequestsApi";


export default function RequestOverviewTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: request } = useGetAdminRequestByIdQuery(id);

  if (!request) return null;

  return (
    <div className="space-y-5">
      <SurfaceCard title="معلومات الطلب">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <FileText className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">الحالة</p>
              <div className="mt-1">
                <AdminStatusBadge domain="request" status={request.status} />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Building2 className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">اسم الشركة</p>
              <p className="text-sm font-medium text-natural-100">
                {request.companyName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Briefcase className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">النشاط التجاري</p>
              <p className="text-sm font-medium text-natural-100">
                {request.businessName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Tag className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">نوع النشاط</p>
              <p className="text-sm font-medium text-natural-100">
                {request.businessType}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">تاريخ الطلب</p>
              <p className="text-sm font-medium text-natural-100">
                {new Date(request.createdAt).toLocaleDateString("ar-SA")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Clock className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">آخر تحديث</p>
              <p className="text-sm font-medium text-natural-100">
                {new Date(request.updatedAt).toLocaleDateString("ar-SA")}
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard title="معلومات الاتصال">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <User className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">اسم جهة الاتصال</p>
              <p className="text-sm font-medium text-natural-100">
                {request.contactName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Phone className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">
                رقم الهاتف / واتساب
              </p>
              <p className="text-sm font-medium text-natural-100" dir="ltr">
                {request.phoneWhatsapp}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Mail className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">البريد الإلكتروني</p>
              <p className="text-sm font-medium text-natural-100">
                {request.email || "—"}
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SurfaceCard title="العميل والمسؤول">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <UserCircle className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">العميل</p>
                <p className="text-sm font-medium text-natural-100">
                  {request.client?.companyName || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <UserCircle className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">
                  المسؤول (المبيعات)
                </p>
                <p className="text-sm font-medium text-natural-100">
                  {request.assignee?.name || "—"}
                </p>
                {request.assignee && (
                  <p className="text-xs text-portal-note-text">
                    {request.assignee.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard title="مصدر الطلب">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <FileText className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">المصدر</p>
              <p className="text-sm font-medium text-natural-100">
                {request.source}
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard title="الخدمات المطلوبة">
        {request.services.length === 0 ? (
          <p className="text-sm text-portal-note-text">لا توجد خدمات مضافة</p>
        ) : (
          <div className="space-y-3">
            {request.services.map((svc) => (
              <div
                key={svc.id}
                className="flex items-center justify-between p-4 rounded-xl border border-portal-card-border"
              >
                <div>
                  <p className="text-sm font-medium text-natural-100">
                    {svc.serviceId}
                  </p>
                  {svc.notes && (
                    <p className="text-xs text-portal-note-text mt-1">
                      {svc.notes}
                    </p>
                  )}
                </div>
                <span className="text-sm text-portal-note-text">
                  الكمية: {svc.quantity}
                </span>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      {request.notes && (
        <SurfaceCard title="الملاحظات">
          <p className="text-sm text-natural-100 whitespace-pre-wrap">
            {request.notes}
          </p>
        </SurfaceCard>
      )}

      {request.internalNotes && (
        <SurfaceCard title="ملاحظات داخلية">
          <p className="text-sm text-natural-100 whitespace-pre-wrap">
            {request.internalNotes}
          </p>
        </SurfaceCard>
      )}
    </div>
  );
}
