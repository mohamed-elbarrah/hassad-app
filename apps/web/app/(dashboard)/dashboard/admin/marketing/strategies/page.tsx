"use client";

import { useState } from "react";
import {
  Megaphone,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  FileText,
  RotateCcw,
  Download,
} from "lucide-react";
import { MARKETING_STRATEGY_STATUS_AR } from "@hassad/shared";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatCard } from "@/components/design-system/StatCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Dialog } from "@/components/design-system/Dialog";
import { Skeleton } from "@/components/design-system/Skeleton";
import { EmptyState } from "@/components/design-system/EmptyState";
import { toast } from "sonner";
import {
  useGetAdminMarketingStrategiesQuery,
  useUpdateAdminMarketingStrategyStatusMutation,
} from "@/features/admin/adminApi";

const FILTER_TABS = [
  { value: "", label: "الكل" },
  { value: "SENT", label: "بانتظار الاعتماد" },
  { value: "APPROVED", label: "معتمدة" },
  { value: "REJECTED", label: "مرفوضة" },
];

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

  const strategies = data?.items ?? [];
  const totalStrategies = data?.total ?? strategies.length;

  const statPending = strategies.filter((s: any) => s.status === "SENT").length;
  const statApproved = strategies.filter((s: any) => s.status === "APPROVED").length;
  const statRejected = strategies.filter((s: any) => s.status === "REJECTED").length;

  const handleAction = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status, note: actionNote }).unwrap();
      const msgs: Record<string, string> = {
        APPROVED: "تم اعتماد الاستراتيجية",
        REJECTED: "تم رفض الاستراتيجية",
        REVISION_REQUESTED: "تم طلب تعديل الاستراتيجية",
      };
      toast.success(msgs[status] ?? "تم تحديث الحالة");
      setActionNote("");
    } catch {
      toast.error("حدث خطأ");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="الاستراتيجيات التسويقية"
        description="إدارة واعتماد استراتيجيات التسويق المقدمة من فريق التسويق"
        icon={Megaphone}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-[30px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="إجمالي الاستراتيجيات" value={totalStrategies} icon={Megaphone} />
          <StatCard
            title="بانتظار الاعتماد"
            value={statPending}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="معتمدة"
            value={statApproved}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="مرفوضة"
            value={statRejected}
            icon={XCircle}
            variant="danger"
          />
        </div>
      )}

      <SurfaceCard>
        <div className="flex items-center gap-2 mb-4">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-secondary-500 text-white"
                  : "bg-badge-gray-bg text-portal-note-text hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={Megaphone}
            title="تعذّر تحميل الاستراتيجيات"
            hint="قد تكون المشكلة في الاتصال. حاول مجدداً."
          />
        ) : (
          <DataTable
            columns={[
              { id: "client", label: "العميل" },
              { id: "project", label: "المشروع" },
              { id: "status", label: "الحالة" },
              { id: "file", label: "الملف" },
              { id: "approver", label: "المعتمِد" },
              { id: "approvedAt", label: "تاريخ الاعتماد" },
              { id: "actions", label: "", align: "left" },
            ]}
            data={strategies}
            isLoading={false}
            isError={false}
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
                <td className="px-5 py-3 text-sm font-medium">{s.client?.companyName ?? s.clientName ?? "—"}</td>
                <td className="px-5 py-3 text-sm">{s.project?.name ?? s.projectName ?? "—"}</td>
                <td className="px-5 py-3 text-sm">
                  <StatusBadge
                    status={s.status}
                    label={MARKETING_STRATEGY_STATUS_AR[s.status as keyof typeof MARKETING_STRATEGY_STATUS_AR] ?? s.status}
                  />
                </td>
                <td className="px-5 py-3 text-sm">
                  {s.fileName ? (
                    <a
                      href={s.fileUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-secondary-500 hover:text-secondary-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="size-3.5" />
                      <span className="text-xs">{s.fileName}</span>
                      <Download className="size-3" />
                    </a>
                  ) : (
                    <span className="text-portal-note-text">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-sm text-portal-note-text">
                  {s.approver?.name ?? "—"}
                </td>
                <td className="px-5 py-3 text-sm text-portal-note-text">
                  {s.approvedAt ? new Date(s.approvedAt).toLocaleDateString("ar-SA") : "—"}
                </td>
                <td className="px-5 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                  {s.status === "SENT" && (
                    <div className="flex gap-1">
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="text-success-600 hover:text-success-700"
                        onClick={() => handleAction(s.id, "APPROVED")}
                        disabled={updating}
                      >
                        <CheckCircle className="size-4 ml-1" />
                        اعتماد
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="text-danger-500 hover:text-danger-600"
                        onClick={() => handleAction(s.id, "REJECTED")}
                        disabled={updating}
                      >
                        <XCircle className="size-4 ml-1" />
                        رفض
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="text-alert-600 hover:text-alert-700"
                        onClick={() => handleAction(s.id, "REVISION_REQUESTED")}
                        disabled={updating}
                      >
                        <RotateCcw className="size-4 ml-1" />
                        تعديل
                      </ActionButton>
                    </div>
                  )}
                  {s.status !== "SENT" && (
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
        )}
      </SurfaceCard>

      <Dialog
        open={showDetail}
        onOpenChange={setShowDetail}
        title="تفاصيل الاستراتيجية"
        contentClassName="sm:max-w-2xl"
        footer={
          <div className="flex gap-2 justify-end">
            {selectedStrategy?.status === "SENT" && (
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
                  variant="outline"
                  className="text-alert-600 border-alert-600"
                  onClick={() => handleAction(selectedStrategy.id, "REVISION_REQUESTED")}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4 ml-1" />}
                  طلب تعديل
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
              <p className="text-sm font-medium">{selectedStrategy?.client?.companyName ?? selectedStrategy?.clientName ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-portal-note-text">المشروع</p>
              <p className="text-sm font-medium">{selectedStrategy?.project?.name ?? selectedStrategy?.projectName ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-portal-note-text">الحالة</p>
              <StatusBadge
                status={selectedStrategy?.status}
                label={MARKETING_STRATEGY_STATUS_AR[selectedStrategy?.status as keyof typeof MARKETING_STRATEGY_STATUS_AR] ?? selectedStrategy?.status}
              />
            </div>
            <div>
              <p className="text-sm text-portal-note-text">الملف</p>
              {selectedStrategy?.fileName ? (
                <a
                  href={selectedStrategy.fileUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-secondary-500 hover:text-secondary-600 flex items-center gap-1"
                >
                  <FileText className="size-3.5" />
                  {selectedStrategy.fileName}
                </a>
              ) : (
                <p className="text-sm font-medium">—</p>
              )}
            </div>
            <div>
              <p className="text-sm text-portal-note-text">المعتمِد</p>
              <p className="text-sm font-medium">{selectedStrategy?.approver?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-portal-note-text">تاريخ الاعتماد</p>
              <p className="text-sm font-medium">
                {selectedStrategy?.approvedAt
                  ? new Date(selectedStrategy.approvedAt).toLocaleDateString("ar-SA")
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
