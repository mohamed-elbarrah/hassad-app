"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  ArrowRight, Briefcase, UserCog, Archive, Flag, DollarSign, FileCheck, CalendarRange,
  UserPlus, Plus, Clock, History, AlertTriangle, MessageSquare,
} from "lucide-react";
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
import { EmptyState } from "@/components/design-system/EmptyState";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { TimelineItem } from "@/components/design-system/Timeline";
import { toast } from "sonner";
import {
  useGetAdminProjectQuery,
  useAddProjectMemberMutation,
  useCreateProjectTaskMutation,
  useReassignProjectPmMutation,
  useArchiveProjectMutation,
  useForceProjectStatusMutation,
} from "@/features/admin/adminApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import {
  PROJECT_STATUS_AR,
  TASK_STATUS_AR,
  TASK_PRIORITY_AR,
  INVOICE_STATUS_AR,
  PAYMENT_METHOD_AR,
  PAYMENT_STATUS_AR,
  DISPUTE_STATUS_AR,
  DISPUTE_PRIORITY_AR,
  DISPUTE_CATEGORY_AR,
} from "@hassad/shared";
import { cn } from "@/lib/utils";
import { format, differenceInDays, startOfMonth, endOfMonth, addMonths, isAfter, isBefore, isToday, isSameDay } from "date-fns";

function GanttChart({ periods }: { periods: any[] }) {
  const now = new Date();

  const { minDate, maxDate, totalDays, monthTicks } = useMemo(() => {
    if (!periods || periods.length === 0) return { minDate: now, maxDate: now, totalDays: 1, monthTicks: [] };

    const starts = periods.map((p) => new Date(p.startDate));
    const ends = periods.map((p) => new Date(p.endDate));
    const min = new Date(Math.min(...starts.map((d) => d.getTime())));
    const max = new Date(Math.max(...ends.map((d) => d.getTime())));

    const ticks: Date[] = [];
    let cursor = startOfMonth(min);
    while (!isAfter(cursor, max)) {
      ticks.push(cursor);
      cursor = addMonths(cursor, 1);
    }
    if (ticks.length === 0) ticks.push(min);

    const days = differenceInDays(max, min) || 1;
    return { minDate: min, maxDate: max, totalDays: days, monthTicks: ticks };
  }, [periods]);

  const getLeft = (d: Date) => (differenceInDays(d, minDate) / totalDays) * 100;
  const getWidth = (start: Date, end: Date) =>
    Math.max((differenceInDays(end, start) / totalDays) * 100, 2);

  const barColors: Record<string, string> = {
    CLOSED: "bg-green-500",
    ACTIVE: "bg-blue-500",
    SUSPENDED: "bg-amber-400",
    UPCOMING: "bg-gray-300",
  };
  const barLabels: Record<string, string> = {
    CLOSED: "مكتمل",
    ACTIVE: "قيد التنفيذ",
    SUSPENDED: "معلق",
    UPCOMING: "قادم",
  };

  const todayPos = (() => {
    const d = differenceInDays(now, minDate);
    if (d < 0) return -1;
    if (d > totalDays) return -1;
    return (d / totalDays) * 100;
  })();

  return (
    <div className="overflow-x-auto" dir="ltr">
      <div className="min-w-[600px]">
        <div className="relative h-8 mb-2">
          {monthTicks.map((tick, i) => {
            const left = getLeft(tick);
            const nextTick = monthTicks[i + 1] ?? addMonths(tick, 1);
            const w = getWidth(tick, nextTick);
            return (
              <div
                key={i}
                className="absolute top-0 text-xs text-portal-note-text font-medium"
                style={{ left: `${left}%`, width: `${w}%` }}
              >
                <span className="inline-block pr-1">{format(tick, "MMM yyyy")}</span>
              </div>
            );
          })}
        </div>

        <div className="relative border-t border-portal-divider">
          {todayPos >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
              style={{ left: `${todayPos}%` }}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-medium whitespace-nowrap">
                اليوم
              </span>
            </div>
          )}

          <div className="grid grid-rows-[repeat(auto-fit,52px)]">
            {periods.map((p, idx) => {
              const start = new Date(p.startDate);
              const end = new Date(p.endDate);
              const left = getLeft(start);
              const w = getWidth(start, end);
              const color = barColors[p.status] ?? "bg-gray-300";
              const isComplete = p.status === "CLOSED";

              return (
                <div key={p.id} className="relative flex items-center border-b border-portal-divider py-2" style={{ minHeight: 52 }}>
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-28 shrink-0 text-left">
                      <p className="text-sm font-medium text-natural-100 truncate">
                        الفترة {p.periodNumber}
                      </p>
                      <p className="text-[11px] text-portal-note-text">{barLabels[p.status] ?? p.status}</p>
                    </div>

                    <div className="relative flex-1 h-7">
                      <div className="absolute inset-0 bg-gray-100 rounded-full" />
                      <div
                        className={cn(
                          "absolute top-0 h-full rounded-full transition-all",
                          color,
                          p.status === "UPCOMING" && "bg-gray-200 border border-gray-300",
                        )}
                        style={{ left: `${left}%`, width: `${w}%`, minWidth: 4 }}
                      />
                      {isComplete && (
                        <span className="absolute left-1/2 top-1/2 -translate-y-1/2 text-xs text-white font-medium z-10">
                          {p.completionPercentage}%
                        </span>
                      )}
                    </div>

                    <div className="w-44 shrink-0 text-right flex items-center gap-2 justify-end">
                      <span className="text-xs text-portal-note-text">
                        {format(start, "dd/MM/yyyy")} - {format(end, "dd/MM/yyyy")}
                      </span>
                      {isComplete && <span className="text-green-600 text-sm">✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-portal-divider text-xs text-portal-note-text">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500" />
            مكتمل
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500" />
            قيد التنفيذ
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-300" />
            قادم
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400" />
            معلق
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: project, isLoading } = useGetAdminProjectQuery(id);
  const [reassignPm] = useReassignProjectPmMutation();
  const [archiveProject] = useArchiveProjectMutation();
  const [forceStatus] = useForceProjectStatusMutation();
  const [addMember] = useAddProjectMemberMutation();
  const [createTask] = useCreateProjectTaskMutation();

  const [showReassign, setShowReassign] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [pmSearch, setPmSearch] = useState("");
  const [selectedPmId, setSelectedPmId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");

  const [memberSearch, setMemberSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");

  const [taskForm, setTaskForm] = useState({
    title: "",
    assigneeId: "",
    priority: "NORMAL",
    dueDate: "",
    status: "TODO",
  });
  const [taskAssigneeSearch, setTaskAssigneeSearch] = useState("");

  const { data: pmData } = useSearchUsersQuery(
    { role: "PM", limit: 20, search: pmSearch || undefined },
    { skip: !showReassign },
  );
  const { data: memberSearchData } = useSearchUsersQuery(
    { search: memberSearch || undefined, limit: 20 },
    { skip: !showAddMember },
  );
  const { data: taskAssigneeData } = useSearchUsersQuery(
    { search: taskAssigneeSearch || undefined, limit: 20 },
    { skip: !showAddTask },
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
          <div className="flex gap-2 flex-wrap">
            <ActionButton size="md" onClick={() => setShowAddMember(true)}>
              <UserPlus className="size-4 ml-1" />
              إضافة عضو
            </ActionButton>
            <ActionButton size="md" onClick={() => setShowAddTask(true)}>
              <Plus className="size-4 ml-1" />
              إضافة مهمة
            </ActionButton>
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
            <TabsTrigger value="gantt">المخطط الزمني</TabsTrigger>
            <TabsTrigger value="finance">المالية</TabsTrigger>
            <TabsTrigger value="deliverables">التسليمات</TabsTrigger>
            <TabsTrigger value="history">سجل التغييرات</TabsTrigger>
            <TabsTrigger value="disputes">النزاعات</TabsTrigger>
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

            <TabsContent value="gantt">
              {!project.periods || project.periods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-portal-note-text">
                  <CalendarRange className="size-12 mb-4 opacity-40" />
                  <p className="text-sm">لا توجد فترات زمنية</p>
                  <p className="text-xs mt-1">لم يتم إنشاء فترات لهذا المشروع بعد</p>
                </div>
              ) : (
                <GanttChart periods={project.periods} />
              )}
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

            <TabsContent value="history">
              <div className="space-y-4">
                {(!project.history || project.history.length === 0) ? (
                  <EmptyState icon={History} title="لا يوجد سجل تغييرات" hint="لم يتم تسجيل أي تغييرات لهذا المشروع بعد" />
                ) : (
                  project.history.map((h: any, idx: number) => {
                    const actionMap: Record<string, string> = {
                      "admin.projects.reassign-pm": "إعادة تعيين PM",
                      "admin.projects.archive": "أرشفة المشروع",
                      "admin.projects.force-status": "تغيير الحالة",
                      "admin.projects.add-member": "إضافة عضو",
                      "admin.projects.add-task": "إضافة مهمة",
                      "admin.projects.create": "إنشاء المشروع",
                    };
                    const actionLabel = actionMap[h.action] ?? h.action;
                    const variant =
                      h.action === "admin.projects.force-status"
                        ? "warning"
                        : h.action === "admin.projects.archive"
                          ? "danger"
                          : h.action === "admin.projects.create"
                            ? "success"
                            : "default";
                    return (
                      <TimelineItem
                        key={h.id}
                        title={actionLabel}
                        description={
                          h.after ? (
                            <span className="text-xs text-portal-note-text">
                              {h.after.previousStatus
                                ? `${PROJECT_STATUS_AR[h.after.previousStatus] ?? h.after.previousStatus} ← ${PROJECT_STATUS_AR[h.after.newStatus] ?? h.after.newStatus}`
                                : h.after.previousPmId
                                  ? `PM جديد: ${h.after.newPmId}`
                                  : h.after.name
                                    ? `العميل: ${h.after.name}`
                                    : JSON.stringify(h.after)}
                              {h.after.reason ? ` — ${h.after.reason}` : ""}
                            </span>
                          ) : null
                        }
                        timestamp={format(new Date(h.createdAt), "dd/MM/yyyy HH:mm")}
                        variant={variant as any}
                        icon={
                          h.action === "admin.projects.force-status"
                            ? <Flag className="size-3.5 text-white" />
                            : h.action === "admin.projects.reassign-pm"
                              ? <UserCog className="size-3.5 text-white" />
                              : <Clock className="size-3.5 text-white" />
                        }
                        isLast={idx === project.history.length - 1}
                      />
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="disputes">
              <DataTable
                columns={[
                  { id: "ticketNumber", label: "رقم التذكرة" },
                  { id: "title", label: "العنوان" },
                  { id: "category", label: "التصنيف" },
                  { id: "status", label: "الحالة" },
                  { id: "priority", label: "الأولوية" },
                  { id: "openedAt", label: "تاريخ الإنشاء", align: "left" },
                ]}
                data={project.disputeTickets ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: AlertTriangle,
                  message: "لا توجد نزاعات",
                  hint: "لم يتم تسجيل أي نزاعات لهذا المشروع بعد",
                }}
                renderRow={(d: any) => (
                  <tr key={d.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">#TKT-{String(d.ticketNumber).padStart(3, "0")}</td>
                    <td className="px-5 py-3 text-sm font-medium text-natural-100">{d.title}</td>
                    <td className="px-5 py-3 text-sm">{DISPUTE_CATEGORY_AR[d.category] ?? d.category}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={d.status} label={DISPUTE_STATUS_AR[d.status] ?? d.status} />
                    </td>
                    <td className="px-5 py-3">
                      <Pill tone={d.priority === "URGENT" ? "danger" : d.priority === "HIGH" ? "warning" : "neutral"}>
                        {DISPUTE_PRIORITY_AR[d.priority] ?? d.priority}
                      </Pill>
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {d.openedAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
          </div>
        </Tabs>
      </SurfaceCard>

      <Dialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        title="إضافة عضو للمشروع"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton variant="outline" onClick={() => setShowAddMember(false)}>إلغاء</ActionButton>
            <ActionButton
              onClick={async () => {
                if (!selectedUserId) { toast.error("يرجى اختيار مستخدم"); return; }
                try {
                  await addMember({ id, userId: selectedUserId, role: memberRole }).unwrap();
                  toast.success("تم إضافة العضو");
                  setShowAddMember(false);
                  setSelectedUserId("");
                } catch { toast.error("فشل"); }
              }}
            >تأكيد</ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-500 mb-1">الدور</label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
            >
              <option value="MEMBER">عضو</option>
              <option value="MANAGER">مدير</option>
              <option value="VIEWER">مشاهد</option>
            </select>
          </div>
          <FormInputControl
            placeholder="ابحث عن مستخدم..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {(memberSearchData?.items ?? []).map((u: any) => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-colors ${selectedUserId === u.id ? "bg-secondary-50 text-secondary-600" : "hover:bg-badge-gray-bg"}`}
              >
                {u.name} — {u.email}
              </button>
            ))}
          </div>
        </div>
      </Dialog>

      <Dialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        title="إضافة مهمة جديدة"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton variant="outline" onClick={() => setShowAddTask(false)}>إلغاء</ActionButton>
            <ActionButton
              onClick={async () => {
                if (!taskForm.title) { toast.error("يرجى إدخال عنوان المهمة"); return; }
                try {
                  await createTask({ id, ...taskForm }).unwrap();
                  toast.success("تم إضافة المهمة");
                  setShowAddTask(false);
                  setTaskForm({ title: "", assigneeId: "", priority: "NORMAL", dueDate: "", status: "TODO" });
                } catch { toast.error("فشل"); }
              }}
            >تأكيد</ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-500 mb-1">عنوان المهمة *</label>
            <FormInputControl
              placeholder="عنوان المهمة"
              value={taskForm.title}
              onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-500 mb-1">الأولوية</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
              >
                {Object.entries(TASK_PRIORITY_AR).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500 mb-1">الحالة</label>
              <select
                value={taskForm.status}
                onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
              >
                {Object.entries(TASK_STATUS_AR).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-500 mb-1">تاريخ التسليم</label>
            <FormInputControl
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-500 mb-1">المسؤول</label>
            <FormInputControl
              placeholder="ابحث عن مستخدم..."
              value={taskAssigneeSearch}
              onChange={(e) => setTaskAssigneeSearch(e.target.value)}
            />
            <div className="max-h-32 overflow-y-auto mt-1 space-y-1">
              {(taskAssigneeData?.items ?? []).map((u: any) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setTaskForm((f) => ({ ...f, assigneeId: u.id }))}
                  className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-colors ${taskForm.assigneeId === u.id ? "bg-secondary-50 text-secondary-600" : "hover:bg-badge-gray-bg"}`}
                >
                  {u.name} — {u.email}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

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
