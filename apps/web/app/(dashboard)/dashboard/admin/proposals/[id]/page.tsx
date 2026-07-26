"use client";

import { use } from "react";
import Link from "next/link";
import { Building2, User, DollarSign, FileCheck, ClipboardList } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminDetailBreadcrumb } from "@/components/dashboard/admin/shared/AdminDetailBreadcrumb";
import { useGetAdminProposalByIdQuery } from "@/features/admin/adminProposalsApi";

export default function AdminProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: proposal } = useGetAdminProposalByIdQuery(id);

  if (!proposal) return null;

  return (
    <div className="page-shell max-w-4xl" dir="rtl">
      <AdminDetailBreadcrumb
        backHref="/dashboard/admin/proposals"
        backLabel="عروض الأسعار"
        title={proposal.title}
      />

      <div>
        <h1 className="text-2xl font-bold text-natural-100">
          {proposal.title}
        </h1>
        <div className="mt-2">
          <AdminStatusBadge domain="proposal" status={proposal.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SurfaceCard title="معلومات العرض">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <DollarSign className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">المبلغ الإجمالي</p>
                <p className="text-sm font-medium text-natural-100">
                  {proposal.totalPrice.toLocaleString("ar-SA", {
                    style: "currency",
                    currency: "SAR",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <ClipboardList className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">تاريخ الإنشاء</p>
                <p className="text-sm font-medium text-natural-100">
                  {new Date(proposal.createdAt).toLocaleDateString("ar-SA")}
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard title="العميل">
          <div className="space-y-4">
            {proposal.client ? (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
                <Building2 className="h-5 w-5 text-secondary-500 mt-0.5" />
                <div>
                  <p className="text-xs text-portal-note-text">الشركة</p>
                  <p className="text-sm font-medium text-natural-100">
                    {proposal.client.companyName}
                  </p>
                </div>
              </div>
            ) : proposal.lead ? (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
                <Building2 className="h-5 w-5 text-secondary-500 mt-0.5" />
                <div>
                  <p className="text-xs text-portal-note-text">الفرصة</p>
                  <p className="text-sm font-medium text-natural-100">
                    {proposal.lead.companyName}
                  </p>
                  <p className="text-xs text-portal-note-text mt-1">
                    {proposal.lead.contactName}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-portal-note-text">—</p>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard title="المنشئ">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <User className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">الاسم</p>
              <p className="text-sm font-medium text-natural-100">
                {proposal.creator?.name || "—"}
              </p>
              {proposal.creator?.email && (
                <p className="text-xs text-portal-note-text mt-1">
                  {proposal.creator.email}
                </p>
              )}
            </div>
          </div>
        </SurfaceCard>

        {proposal.request && (
          <SurfaceCard title="طلب العميل">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <ClipboardList className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">الشركة</p>
                <p className="text-sm font-medium text-natural-100">
                  {proposal.request.companyName}
                </p>
                <p className="text-xs text-portal-note-text mt-1">
                  جهة الاتصال: {proposal.request.contactName}
                </p>
                <div className="mt-1">
                  <AdminStatusBadge
                    domain="request"
                    status={proposal.request.status}
                  />
                </div>
              </div>
            </div>
          </SurfaceCard>
        )}

        {proposal.contract && (
          <SurfaceCard title="العقد المرتبط">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
              <FileCheck className="h-5 w-5 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-xs text-portal-note-text">العنوان</p>
                <Link
                  href={`/dashboard/admin/contracts/${proposal.contract.id}`}
                  className="text-sm font-medium text-secondary-500 hover:underline"
                >
                  {proposal.contract.title}
                </Link>
                <div className="mt-1">
                  <AdminStatusBadge
                    domain="contract"
                    status={proposal.contract.status}
                  />
                </div>
              </div>
            </div>
          </SurfaceCard>
        )}
      </div>
    </div>
  );
}
