"use client";

import { use } from "react";
import {
  Building2,
  Briefcase,
  Mail,
  Phone,
  User,
  Calendar,
  Shield,
  FileText,
  FolderOpen,
  Receipt,
  CreditCard,
  FileCheck,
  ClipboardList,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminClientByIdQuery } from "@/features/admin/adminClientsApi";

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  minimumFractionDigits: 0,
});

export default function ClientOverviewTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: client } = useGetAdminClientByIdQuery(id);

  if (!client) return null;

  const infoCards = [
    {
      icon: Building2,
      label: "اسم الشركة",
      value: client.companyName || "—",
    },
    {
      icon: Briefcase,
      label: "النشاط التجاري",
      value: client.businessName || client.businessType || "—",
    },
    {
      icon: Mail,
      label: "البريد الإلكتروني",
      value: client.email || "—",
    },
    {
      icon: Phone,
      label: "رقم الهاتف",
      value: client.phone || "—",
    },
    {
      icon: Shield,
      label: "الحالة",
      value: (
        <AdminStatusBadge domain="client" status={client.status} />
      ),
    },
    {
      icon: User,
      label: "مدير العميل",
      value: client.manager
        ? `${client.manager.name} (${client.manager.email})`
        : client.managerName || "—",
    },
    {
      icon: Calendar,
      label: "تاريخ التسجيل",
      value: new Date(client.createdAt).toLocaleDateString("ar-SA"),
    },
    {
      icon: Calendar,
      label: "آخر تسجيل دخول",
      value: client.lastLoginAt
        ? new Date(client.lastLoginAt).toLocaleDateString("ar-SA")
        : "—",
    },
  ];

  const counterItems = [
    { icon: FileText, label: "العقود", count: client.counters.contracts },
    { icon: FolderOpen, label: "المشاريع", count: client.counters.projects },
    { icon: Receipt, label: "الفواتير", count: client.counters.invoices },
    { icon: CreditCard, label: "المدفوعات", count: client.counters.payments },
    { icon: FileCheck, label: "عروض الأسعار", count: client.counters.proposals },
    { icon: ClipboardList, label: "الطلبات", count: client.counters.requests },
  ];

  return (
    <div className="space-y-5">
      <SurfaceCard title="معلومات العميل">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoCards.map((card) => (
            <div
              key={card.label}
              className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border"
            >
              <card.icon className="h-5 w-5 text-secondary-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-portal-note-text">{card.label}</p>
                <p className="text-sm font-medium text-natural-100">
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard title="إحصائيات سريعة">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {counterItems.map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-xl border border-portal-card-border text-center"
            >
              <item.icon className="h-5 w-5 text-secondary-500 mx-auto mb-2" />
              <p className="text-2xl font-semibold text-natural-100">
                {item.count}
              </p>
              <p className="text-xs text-portal-note-text mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>

      {client.contracts.length > 0 && (
        <SurfaceCard title="آخر العقود">
          <div className="space-y-3">
            {client.contracts.slice(0, 5).map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-3 rounded-xl border border-portal-card-border"
              >
                <div>
                  <p className="text-sm font-medium text-natural-100">
                    {contract.title}
                  </p>
                  <p className="text-xs text-portal-note-text mt-0.5">
                    {contract.startDate
                      ? new Date(contract.startDate).toLocaleDateString("ar-SA")
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-natural-100">
                    {currencyFormatter.format(contract.totalValue)}
                  </span>
                  <AdminStatusBadge domain="contract" status={contract.status} />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {client.projects.length > 0 && (
        <SurfaceCard title="آخر المشاريع">
          <div className="space-y-3">
            {client.projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-xl border border-portal-card-border"
              >
                <div>
                  <p className="text-sm font-medium text-natural-100">
                    {project.name}
                  </p>
                  <p className="text-xs text-portal-note-text mt-0.5">
                    {project.pmName || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-portal-note-text">
                    {project.completionPercentage}%
                  </span>
                  <AdminStatusBadge domain="project" status={project.status} />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
