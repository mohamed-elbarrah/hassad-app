"use client";

import { use } from "react";
import Link from "next/link";
import {
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";

import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";


const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(n);

export default function ProjectFinanceTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project } = useGetAdminProjectByIdQuery(id);

  if (!project) return null;

  const totalPaid = project.payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((s, p) => s + p.amount, 0);

  void project.invoices
    .filter((inv) => inv.status !== "VOID")
    .reduce((s, inv) => s + inv.amount, 0);

  void project.invoices.filter(
    (inv) =>
      inv.status === "LATE" ||
      (inv.status === "PENDING" &&
        inv.dueDate &&
        new Date(inv.dueDate) < new Date()),
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[30px] border-[1.5px] border-portal-card-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-portal-note-text" />
            <p className="text-sm text-portal-note-text">القيمة الإجمالية</p>
          </div>
          <p className="text-2xl font-semibold text-natural-100">
            {fmtCurrency(project.totalValue)}
          </p>
        </div>
        <div className="rounded-[30px] border-[1.5px] border-portal-card-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-portal-note-text" />
            <p className="text-sm text-portal-note-text">القيمة الشهرية</p>
          </div>
          <p className="text-2xl font-semibold text-natural-100">
            {fmtCurrency(project.monthlyValue || 0)}
          </p>
        </div>
        <div className="rounded-[30px] border-[1.5px] border-portal-card-border p-5 bg-success-100/50">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-success-600" />
            <p className="text-sm text-success-600">المدفوع</p>
          </div>
          <p className="text-2xl font-semibold text-success-700">
            {fmtCurrency(totalPaid)}
          </p>
        </div>
        <div className="rounded-[30px] border-[1.5px] border-portal-card-border p-5 bg-danger-100/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-danger-600" />
            <p className="text-sm text-danger-600">المتبقي</p>
          </div>
          <p className="text-2xl font-semibold text-danger-700">
            {fmtCurrency(project.totalValue - totalPaid)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SurfaceCard title="الفواتير">
          {project.invoices.length === 0 ? (
            <p className="text-sm text-portal-note-text text-center py-4">
              لا توجد فواتير
            </p>
          ) : (
            <div className="space-y-2">
              {project.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-portal-card-border"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-portal-note-text" />
                    <div>
                      <Link
                        href={`/dashboard/admin/finance/invoices/${inv.id}`}
                        className="text-sm text-secondary-500 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <p className="text-xs text-portal-note-text">
                        {inv.dueDate
                          ? new Date(inv.dueDate).toLocaleDateString("ar-SA")
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {fmtCurrency(inv.amount)}
                    </span>
                    <AdminStatusBadge domain="invoice" status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="المدفوعات">
          {project.payments.length === 0 ? (
            <p className="text-sm text-portal-note-text text-center py-4">
              لا توجد مدفوعات
            </p>
          ) : (
            <div className="space-y-2">
              {project.payments.map((pmt) => (
                <div
                  key={pmt.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-portal-card-border"
                >
                  <div>
                    <p className="text-sm font-medium text-natural-100">
                      {pmt.paymentMethod}
                    </p>
                    <p className="text-xs text-portal-note-text">
                      {new Date(pmt.createdAt).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {fmtCurrency(pmt.amount)}
                    </span>
                    <AdminStatusBadge domain="payment" status={pmt.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
