"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Briefcase, UserCog, Archive, Flag, DollarSign, FileCheck } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { DataTable } from "@/components/design-system/DataTable";
import { Dialog } from "@/components/design-system/Dialog";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { toast } from "sonner";
import { useState } from "react";
import {
  useGetAdminProjectQuery,
  useReassignProjectPmMutation,
  useArchiveProjectMutation,
  useForceProjectStatusMutation,
} from "@/features/admin/adminApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { PROJECT_STATUS_AR } from "@hassad/shared";

export default function AdminProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: project, isLoading } = useGetAdminProjectQuery(id);
  const [reassignPm] = useReassignProjectPmMutation();
  const [archiveProject] = useArchiveProjectMutation();
  const [forceStatus] = useForceProjectStatusMutation();

  const [showReassign, setShowReassign] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [pmSearch, setPmSearch] = useState("");
  const [selectedPmId, setSelectedPmId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");

  const { data: pmData } = useSearchUsersQuery(
    { role: "PM", limit: 20, search: pmSearch || undefined },
    { skip: !showReassign },
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center text-portal-note-text" dir="rtl">
        المشروع غير موجود
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={project.name}
        description={`${project.client?.companyName ?? "—"} · ${PROJECT_STATUS_AR[project.status] ?? project.status}`}
        icon={Briefcase}
        actions={
          <div className="flex gap-2">
            <ActionButton
              variant="outline"
              size="md"
              onClick={() => router.push("/dashboard/admin/projects")}
            >
              <ArrowRight className="size-4 ml-1" />
              العودة
            </ActionButton>
            <ActionButton
              variant="outline"
              size="md"
              onClick={() => setShowReassign(true)}
            >
              <UserCog className="size-4 ml-1" />
              إعادة تعيين PM
            </ActionButton>
            <ActionButton
              variant="outline"
              size="md"
              onClick={() => setShowStatus(true)}
            >
              <Flag className="size-4 ml-1" />
              تغيير الحالة
            </ActionButton>
            <ActionButton
              variant="outline"
              size="md"
              onClick={async () => {
                try {
                  await archiveProject(id).unwrap();
                  toast.success("تم أرشفة المشروع");
                  router.push("/dashboard/admin/projects");
                } catch {
                  toast.error("فشل");
                }
              }}
            >
              <Archive className="size-4 ml-1" />
              أرشفة
            </ActionButton>
          </div>
        }
      />

      <SurfaceCard>
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="w-full justify-start gap-1 px-4 pt-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="members">الأعضاء</TabsTrigger>
            <TabsTrigger value="tasks">المهام</TabsTrigger>
            <TabsTrigger value="files">الملفات</TabsTrigger>
            <TabsTrigger value="meetings">الاجتماعات</TabsTrigger>
            <TabsTrigger value="periods">الفترات</TabsTrigger>
            <TabsTrigger value="finance">المالية</TabsTrigger>
            <TabsTrigger value="deliverables">التسليمات</TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">
                      العميل
                    </span>
                    <p className="text-base font-medium">
                      {project.client?.companyName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      مدير المشروع
                    </span>
                    <p className="text-base font-medium">
                      {project.manager?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      الحالة
                    </span>
                    <div className="mt-1">
                      <StatusBadge
                        status={project.status}
                        label={
                          PROJECT_STATUS_AR[project.status] ?? project.status
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      الأولوية
                    </span>
                    <p className="text-base font-medium">{project.priority}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">
                      نسبة الإنجاز
                    </span>
                    <Pill
                      tone={
                        project.completionPercentage >= 100
                          ? "success"
                          : project.completionPercentage >= 50
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {project.completionPercentage}%
                    </Pill>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      تاريخ البداية
                    </span>
                    <p className="text-base font-medium">
                      {project.startDate?.slice(0, 10) ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      تاريخ النهاية
                    </span>
                    <p className="text-base font-medium">
                      {project.endDate?.slice(0, 10) ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">الوصف</span>
                    <p className="text-base font-medium">
                      {project.description ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members">
              <DataTable
                columns={[
                  { id: "name", label: "الاسم" },
                  { id: "email", label: "البريد" },
                  { id: "role", label: "الدور" },
                  { id: "joinedAt", label: "تاريخ الانضمام", align: "left" },
                ]}
                data={project.members ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: Briefcase,
                  message: "لا يوجد أعضاء",
                  hint: "لم يتم إضافة أعضاء للمشروع بعد",
                }}
                renderRow={(m: any) => (
                  <tr key={m.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">
                      {m.user?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">
                      {m.user?.email ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">{m.role}</td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {m.joinedAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>

            <TabsContent value="tasks">
              <DataTable
                columns={[
                  { id: "title", label: "المهمة" },
                  { id: "status", label: "الحالة" },
                  { id: "priority", label: "الأولوية" },
                  { id: "dueDate", label: "تاريخ التسليم", align: "left" },
                ]}
                data={project.tasks ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: Briefcase,
                  message: "لا توجد مهام",
                  hint: "لم يتم إنشاء مهام لهذا المشروع بعد",
                }}
                renderRow={(t: any) => (
                  <tr key={t.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{t.title}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={t.status} label={t.status} />
                    </td>
                    <td className="px-5 py-3">
                      <Pill
                        tone={
                          t.priority === "HIGH"
                            ? "danger"
                            : t.priority === "MEDIUM"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {t.priority}
                      </Pill>
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {t.dueDate?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>

            <TabsContent value="files">
              <DataTable
                columns={[
                  { id: "name", label: "الملف" },
                  { id: "uploadedBy", label: "رفع بواسطة" },
                  { id: "uploadedAt", label: "تاريخ الرفع", align: "left" },
                ]}
                data={project.files ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: Briefcase,
                  message: "لا توجد ملفات",
                  hint: "لم يتم رفع ملفات لهذا المشروع بعد",
                }}
                renderRow={(f: any) => (
                  <tr key={f.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">
                      {f.fileName}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">
                      {f.uploadedBy ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {f.uploadedAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>

            <TabsContent value="meetings">
              <DataTable
                columns={[
                  { id: "title", label: "الاجتماع" },
                  { id: "date", label: "التاريخ", align: "left" },
                  { id: "notes", label: "الملاحظات" },
                ]}
                data={project.meetings ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: Briefcase,
                  message: "لا توجد اجتماعات",
                  hint: "لم يتم تسجيل اجتماعات لهذا المشروع بعد",
                }}
                renderRow={(m: any) => (
                  <tr key={m.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{m.title}</td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {m.scheduledAt?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">
                      {m.notes ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>

            <TabsContent value="periods">
              <DataTable
                columns={[
                  { id: "period", label: "الفترة" },
                  { id: "start", label: "تاريخ البداية", align: "left" },
                  { id: "end", label: "تاريخ النهاية", align: "left" },
                  { id: "status", label: "الحالة" },
                  { id: "completion", label: "الإنجاز" },
                ]}
                data={project.periods ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: Briefcase,
                  message: "لا توجد فترات",
                  hint: "لم يتم إنشاء فترات لهذا المشروع بعد",
                }}
                renderRow={(p: any) => (
                  <tr key={p.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">
                      الفترة {p.periodNumber}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {p.startDate?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {p.endDate?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} label={p.status} />
                    </td>
                    <td className="px-5 py-3">
                      <Pill tone="neutral">{p.completionPercentage ?? 0}%</Pill>
                    </td>
                  </tr>
                )}
              />
            </TabsContent>

            <TabsContent value="finance">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-natural-100 mb-3">الفواتير</h4>
                  <DataTable
                    columns={[
                      { id: "amount", label: "المبلغ" },
                      { id: "status", label: "الحالة" },
                      { id: "date", label: "التاريخ", align: "left" },
                    ]}
                    data={project.invoices ?? []}
                    isLoading={false}
                    isError={false}
                    emptyState={{
                      icon: DollarSign,
                      message: "لا توجد فواتير",
                      hint: "لم يتم إنشاء فواتير لهذا المشروع بعد",
                    }}
                    renderRow={(inv: any) => (
                      <tr key={inv.id} className="border-b border-portal-divider">
                        <td className="px-5 py-3 text-sm font-medium">
                          {inv.amount?.toLocaleString() ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={inv.status} label={inv.status} />
                        </td>
                        <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                          {inv.createdAt?.slice(0, 10) ?? "—"}
                        </td>
                      </tr>
                    )}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-natural-100 mb-3">المدفوعات</h4>
                  <DataTable
                    columns={[
                      { id: "amount", label: "المبلغ" },
                      { id: "method", label: "طريقة الدفع" },
                      { id: "status", label: "الحالة" },
                      { id: "date", label: "التاريخ", align: "left" },
                    ]}
                    data={project.payments ?? []}
                    isLoading={false}
                    isError={false}
                    emptyState={{
                      icon: DollarSign,
                      message: "لا توجد مدفوعات",
                      hint: "لم يتم تسجيل مدفوعات لهذا المشروع بعد",
                    }}
                    renderRow={(pay: any) => (
                      <tr key={pay.id} className="border-b border-portal-divider">
                        <td className="px-5 py-3 text-sm font-medium">
                          {pay.amount?.toLocaleString() ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-sm">{pay.paymentMethod ?? "—"}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={pay.status} label={pay.status} />
                        </td>
                        <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                          {pay.createdAt?.slice(0, 10) ?? "—"}
                        </td>
                      </tr>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deliverables">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-natural-100 mb-3">التسليمات</h4>
                  <DataTable
                    columns={[
                      { id: "title", label: "التسليم" },
                      { id: "status", label: "الحالة" },
                      { id: "visibility", label: "الرؤية" },
                      { id: "approver", label: "المراجع" },
                    ]}
                    data={project.deliverables ?? []}
                    isLoading={false}
                    isError={false}
                    emptyState={{
                      icon: FileCheck,
                      message: "لا توجد تسليمات",
                      hint: "لم يتم إنشاء تسليمات لهذا المشروع بعد",
                    }}
                    renderRow={(d: any) => (
                      <tr key={d.id} className="border-b border-portal-divider">
                        <td className="px-5 py-3 text-sm font-medium">{d.title}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={d.status} label={d.status} />
                        </td>
                        <td className="px-5 py-3 text-sm">{d.visibility ?? "—"}</td>
                        <td className="px-5 py-3 text-sm">{d.approver?.name ?? d.approvedBy ?? "—"}</td>
                      </tr>
                    )}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-natural-100 mb-3">طلبات المراجعة</h4>
                  <DataTable
                    columns={[
                      { id: "description", label: "الوصف" },
                      { id: "status", label: "الحالة" },
                      { id: "date", label: "التاريخ", align: "left" },
                    ]}
                    data={project.revisionRequests ?? []}
                    isLoading={false}
                    isError={false}
                    emptyState={{
                      icon: FileCheck,
                      message: "لا توجد طلبات مراجعة",
                      hint: "لم يتم تقديم طلبات مراجعة لهذا المشروع بعد",
                    }}
                    renderRow={(r: any) => (
                      <tr key={r.id} className="border-b border-portal-divider">
                        <td className="px-5 py-3 text-sm font-medium">{r.description ?? "—"}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={r.status} label={r.status} />
                        </td>
                        <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                          {r.createdAt?.slice(0, 10) ?? "—"}
                        </td>
                      </tr>
                    )}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </SurfaceCard>

      <Dialog
        open={showReassign}
        onOpenChange={setShowReassign}
        title="إعادة تعيين PM"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => setShowReassign(false)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              onClick={async () => {
                if (!selectedPmId) {
                  toast.error("يرجى اختيار PM");
                  return;
                }
                try {
                  await reassignPm({ id, pmUserId: selectedPmId }).unwrap();
                  toast.success("تم إعادة تعيين PM");
                  setShowReassign(false);
                } catch {
                  toast.error("فشل");
                }
              }}
            >
              تأكيد
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <FormInputControl
            placeholder="ابحث عن PM..."
            value={pmSearch}
            onChange={(e) => setPmSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {(pmData?.items ?? []).map((u: any) => (
              <button
                key={u.id}
                onClick={() => setSelectedPmId(u.id)}
                className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-colors ${selectedPmId === u.id ? "bg-secondary-50 text-secondary-600" : "hover:bg-badge-gray-bg"}`}
              >
                {u.name} — {u.email}
              </button>
            ))}
          </div>
        </div>
      </Dialog>

      <Dialog
        open={showStatus}
        onOpenChange={setShowStatus}
        title="تغيير الحالة"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => setShowStatus(false)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              onClick={async () => {
                if (!newStatus || !reason) {
                  toast.error("يرجى اختيار الحالة وكتابة السبب");
                  return;
                }
                try {
                  await forceStatus({ id, status: newStatus, reason }).unwrap();
                  toast.success("تم تغيير الحالة");
                  setShowStatus(false);
                } catch {
                  toast.error("فشل");
                }
              }}
            >
              تأكيد
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
          >
            <option value="">اختر الحالة...</option>
            {Object.entries(PROJECT_STATUS_AR).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <FormInputControl
            placeholder="سبب تغيير الحالة..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
