"use client";

import { useState } from "react";
import {
  Megaphone,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatCard } from "@/components/design-system/StatCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import {
  useGetAdminMarketingStrategiesQuery,
  useUpdateAdminMarketingStrategyStatusMutation,
} from "@/features/admin/adminApi";

const STATUS_MAP: Record<string, { label: string; status: string }> = {
  PENDING_APPROVAL: { label: "بانتظار الاعتماد", status: "PENDING" },
  APPROVED: { label: "معتمد", status: "ACTIVE" },
  REJECTED: { label: "مرفوض", status: "STOPPED" },
};

export default function AdminMarketingStrategiesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionNote, setActionNote] = useState("");

  const { data, isLoading, isError } = useGetAdminMarketingStrategiesQuery({
    page,
    limit: 50,
    status: statusFilter || undefined,
  });
  const [updateStatus, { isLoading: updating }] = useUpdateAdminMarketingStrategyStatusMutation();

  const strategies = data?.items ?? data ?? [];

  const statTotal = strategies.length;
  const statPending = strategies.filter((s: any) => s.status === "PENDING_APPROVAL").length;
  const statApproved = strategies.filter((s: any) => s.status === "APPROVED").length;
  const statRejected = strategies.filter((s: any) => s.status === "REJECTED").length;

  const handleAction = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status, note: actionNote }).unwrap();
      toast.success(status === "APPROVED" ? "تم اعتماد الاستراتيجية" : "تم رفض الاستراتيجية");
      setActionNote("");
    } catch {
      toast.error("حدث خطأ");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="الاستراتيجيات التسويقية"
        description="إدارة واعتماد استراتيجيات التسويق"
        icon={Megaphone}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="الإجمالي" value={statTotal} icon={Megaphone} />
        <StatCard
          title="بانتظار الاعتماد"
          value={statPending}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="تم الاعتماد"
          value={statApproved}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="مرفوض"
          value={statRejected}
          icon={XCircle}
          variant="danger"
        />
      </div>

      <SurfaceCard>
        <div className="flex items-center gap-2 mb-4">
          {["", "PENDING_APPROVAL", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-secondary-500 text-white"
                  : "bg-badge-gray-bg text-portal-note-text hover:bg-neutral-200"
              }`}
            >
              {s === "" ? "الكل" : STATUS_MAP[s]?.label ?? s}
            </button>
          ))}
        </div>

        <DataTable
          columns={[
            { id: "clientName", label: "اسم العميل" },
            { id: "projectName", label: "المشروع" },
            { id: "status", label: "الحالة" },
            { id: "fileName", label: "الملف" },
            { id: "createdAt", label: "تاريخ التقديم" },
            { id: "actions", label: "", align: "left" },
          ]}
          data={strategies}
          isLoading={isLoading}
          isError={isError}
          emptyState={{
            icon: Megaphone,
            message: "لا توجد استراتيجيات",
            hint: "لم يتم تقديم أي استراتيجيات بعد",
          }}
          renderRow={(s: any) => (
            <tr
              key={s.id}
              className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/40"
              onClick={() => {
                setSelectedStrategy(s);
                setShowDetail(true);
              }}
            >
              <td className="px-5 py-3 text-sm font-medium">{s.clientName ?? "—"}</td>
              <td className="px-5 py-3 text-sm">{s.projectName ?? "—"}</td>
              <td className="px-5 py-3 text-sm">
                <StatusBadge
                  status={STATUS_MAP[s.status]?.status ?? "PENDING"}
                  label={STATUS_MAP[s.status]?.label ?? s.status}
                />
              </td>
              <td className="px-5 py-3 text-sm text-portal-note-text">{s.fileName ?? "—"}</td>
              <td className="px-5 py-3 text-sm text-portal-note-text">
                {s.createdAt ? new Date(s.createdAt).toLocaleDateString("ar-SA") : "—"}
              </td>
              <td className="px-5 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                {s.status === "PENDING_APPROVAL" && (
                  <div className="flex gap-1">
                    <ActionButton
                      size="sm"
                      variant="ghost"
                      className="text-success-600 hover:text-success-700"
                      onClick={() => {
                        handleAction(s.id, "APPROVED");
                      }}
                      disabled={updating}
                    >
                      <CheckCircle className="size-4 ml-1" />
                      اعتماد
                    </ActionButton>
                    <ActionButton
                      size="sm"
                      variant="ghost"
                      className="text-danger-500 hover:text-danger-600"
                      onClick={() => {
                        handleAction(s.id, "REJECTED");
                      }}
                      disabled={updating}
                    >
                      <XCircle className="size-4 ml-1" />
                      رفض
                    </ActionButton>
                  </div>
                )}
                {s.status !== "PENDING_APPROVAL" && (
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStrategy(s);
                      setShowDetail(true);
                    }}
                  >
                    <Eye className="size-4" />
                  </ActionButton>
                )}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>

      <Dialog
        open={showDetail}
        onOpenChange={setShowDetail}
        title="تفاصيل الاستراتيجية"
        contentClassName="sm:max-w-2xl"
        footer={
          <div className="flex gap-2 justify-end">
            {selectedStrategy?.status === "PENDING_APPROVAL" && (
              <>
                <ActionButton
                  variant="outline"
                  className="text-danger-500 border-danger-500"
                  onClick={() => handleAction(selectedStrategy.id, "REJECTED")}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4 ml-1" />}
                  رفض
                </ActionButton>
                <ActionButton
                  onClick={() => handleAction(selectedStrategy.id, "APPROVED")}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4 ml-1" />}
                  اعتماد
                </ActionButton>
              </>
            )}
            <ActionButton variant="outline" onClick={() => setShowDetail(false)}>
              إغلاق
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-portal-note-text">العميل</p>
              <p className="text-sm font-medium">{selectedStrategy?.clientName ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-portal-note-text">المشروع</p>
              <p className="text-sm font-medium">{selectedStrategy?.projectName ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-portal-note-text">الحالة</p>
              <StatusBadge
                status={STATUS_MAP[selectedStrategy?.status]?.status ?? "PENDING"}
                label={STATUS_MAP[selectedStrategy?.status]?.label ?? selectedStrategy?.status}
              />
            </div>
            <div>
              <p className="text-sm text-portal-note-text">الملف</p>
              <p className="text-sm font-medium">{selectedStrategy?.fileName ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-portal-note-text">تاريخ التقديم</p>
              <p className="text-sm font-medium">
                {selectedStrategy?.createdAt
                  ? new Date(selectedStrategy.createdAt).toLocaleDateString("ar-SA")
                  : "—"}
              </p>
            </div>
          </div>
          {selectedStrategy?.notes && (
            <div>
              <p className="text-sm text-portal-note-text mb-1">ملاحظات</p>
              <p className="text-sm bg-badge-gray-bg rounded-xl p-3">{selectedStrategy.notes}</p>
            </div>
          )}
          <div>
            <label className="block text-sm text-portal-note-text mb-1">ملاحظات الرفض/الاعتماد</label>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm min-h-[80px]"
              placeholder="أضف ملاحظة..."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
