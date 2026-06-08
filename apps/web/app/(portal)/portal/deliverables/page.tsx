"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { buildPortalFileUrl } from "@/lib/portal-files";
import {
  useGetReviewProjectsQuery,
  useGetProjectReviewDetailQuery,
  useApproveProjectMutation,
  useRequestProjectRevisionMutation,
  useGetProjectProgressQuery,
} from "@/features/portal/portalApi";
import {
  CheckCircle2,
  Clock,
  Eye,
  PackageOpen,
  AlertTriangle,
  FileText,
  Download,
} from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormTextarea } from "@/components/design-system/FormTextarea";
import { Skeleton } from "@/components/design-system/Skeleton";
import { MetricCard } from "@/components/design-system/MetricCard";
import { PageIntro } from "@/components/design-system/PageIntro";
import { Pill, type PillTone } from "@/components/design-system/Pill";
import { ProgressCard } from "@/components/design-system/ProgressCard";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { mapProjectStatusToUI } from "@/lib/utils/statusMapping";

function formatPortalDate(date?: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PortalDeliverablesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const {
    data: reviewProjects,
    isLoading,
    isError,
    refetch: refetchReviewProjects,
  } = useGetReviewProjectsQuery(undefined, {
    skip: !clientId,
    pollingInterval: 30_000,
  });

  const { data: projectProgress } = useGetProjectProgressQuery(undefined, {
    skip: !clientId,
    pollingInterval: 30_000,
  });

  const [approveProject, { isLoading: isApproving }] =
    useApproveProjectMutation();
  const [requestRevision, { isLoading: isRequestingRevision }] =
    useRequestProjectRevisionMutation();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [revisionComment, setRevisionComment] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const { data: selectedProject } = useGetProjectReviewDetailQuery(
    selectedProjectId!,
    { skip: !selectedProjectId, pollingInterval: 30_000 },
  );

  async function handleApprove(projectId: string) {
    try {
      await approveProject(projectId).unwrap();
      setSelectedProjectId(null);
      refetchReviewProjects();
      toast.success("تمت الموافقة على المشروع بنجاح");
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء الموافقة على المشروع");
    }
  }

  async function handleRequestRevision(projectId: string) {
    if (!revisionComment.trim()) return;
    try {
      await requestRevision({
        id: projectId,
        comment: revisionComment,
      }).unwrap();
      setRevisionComment("");
      setShowRevisionForm(false);
      setSelectedProjectId(null);
      refetchReviewProjects();
      toast.success("تم إرسال طلب التعديل بنجاح");
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء إرسال طلب التعديل");
    }
  }

  const metrics = useMemo(() => {
    const total = projectProgress?.overallProgress ?? 0;
    const totalProjects = projectProgress?.totalProjects ?? 0;
    const awaitingReview = reviewProjects?.length ?? 0;

    return {
      total,
      totalProjects,
      awaitingReview,
    };
  }, [projectProgress, reviewProjects]);

  const progressValue = Math.round(metrics.total);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="مراجعة المشاريع"
        description="المشاريع الجاهزة للمراجعة والموافقة. راجع أعمال فريقك ووافق عليها أو اطلب تعديلات."
        icon={Eye}
      />

      {!clientId && (
        <SurfaceCard title="تعذر تحميل المشاريع" icon={PackageOpen}>
          <p className="text-sm leading-6 text-portal-note-text">
            لم يتم ربط حسابك بملف عميل.
          </p>
        </SurfaceCard>
      )}

      {clientId && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="بانتظار المراجعة"
              value={metrics.awaitingReview}
              pillText="مشاريع"
              pillTone="warning"
            />
            <MetricCard
              title="إجمالي المشاريع"
              value={metrics.totalProjects}
              pillText="مشروع"
              pillTone="neutral"
            />
            <ProgressCard
              title="تقدم المشاريع"
              value={progressValue}
              max={100}
              summary={`${progressValue}% إنجاز`}
            />
          </div>

          <SurfaceCard title="المشاريع بانتظار المراجعة" icon={Eye}>
            {isLoading && (
              <div className="grid gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-[30px] border-[1.5px] border-portal-divider bg-portal-bg p-5"
                  >
                    <Skeleton className="h-8 w-48 rounded-2xl" />
                    <Skeleton className="h-5 w-32 rounded-2xl" />
                    <Skeleton className="h-4 w-64 rounded-2xl" />
                    <div className="grid gap-2 sm:grid-cols-3">
                      {Array.from({ length: 3 }).map((__, i) => (
                        <Skeleton key={i} className="h-10 rounded-2xl" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-2xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-6 text-center">
                <p className="text-base font-medium text-danger-700">
                  حدث خطأ أثناء تحميل المشاريع.
                </p>
                <p className="mt-2 text-sm text-danger-600">
                  يرجى المحاولة لاحقاً أو تحديث الصفحة.
                </p>
              </div>
            )}

            {!isLoading &&
              !isError &&
              (!reviewProjects || reviewProjects.length === 0) && (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
                    <CheckCircle2 className="h-8 w-8 text-secondary-500" />
                  </div>
                  <p className="text-lg font-medium text-natural-100">
                    لا توجد مشاريع بانتظار المراجعة حالياً.
                  </p>
                  <p className="max-w-md text-sm leading-6 text-portal-note-text">
                    ستظهر هنا المشاريع عندما يكتملها فريقك ويقدمها لمراجعتك.
                  </p>
                </div>
              )}

            {!isLoading &&
              !isError &&
              reviewProjects &&
              reviewProjects.length > 0 && (
                <div className="grid gap-4 xl:grid-cols-2">
                  {reviewProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setShowRevisionForm(false);
                        setRevisionComment("");
                      }}
                      className="group space-y-3 rounded-[30px] border-[1.5px] border-portal-divider bg-portal-bg p-5 text-right transition-colors hover:border-action-blue/40 hover:bg-portal-bg/80"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <h3 className="text-lg font-semibold text-natural-100 group-hover:text-action-blue">
                            {project.name}
                          </h3>
                          {project.description && (
                            <p className="text-sm text-portal-note-text line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <StatusBadge
                          status={mapProjectStatusToUI(project.status)}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-portal-note-text">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatPortalDate(project.startDate)} —{" "}
                          {formatPortalDate(project.endDate)}
                        </span>
                        {project.manager && <span>{project.manager.name}</span>}
                        <span>{project.completionPercentage}% مكتمل</span>
                      </div>

                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gauge-track">
                        <div
                          className="h-full rounded-full bg-gauge-fill transition-all"
                          style={{ width: `${project.completionPercentage}%` }}
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-portal-note-text">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {project.taskCount} مهمة
                        </span>
                        <span>{project.deliverableCount} تسليم</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
          </SurfaceCard>
        </>
      )}

      {/* ── Project Review Modal ──────────────────────────────────────────── */}
      {selectedProjectId && selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          dir="rtl"
          onClick={() => {
            setSelectedProjectId(null);
            setShowRevisionForm(false);
            setRevisionComment("");
          }}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border-[1.5px] border-portal-divider bg-natural-0 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <h2 className="text-xl font-bold text-natural-100">
                  {selectedProject.name}
                </h2>
                {selectedProject.description && (
                  <p className="text-sm text-portal-note-text">
                    {selectedProject.description}
                  </p>
                )}
              </div>
              <StatusBadge
                status={mapProjectStatusToUI(selectedProject.status)}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-portal-note-text">
              <span>
                {formatPortalDate(selectedProject.startDate)} —{" "}
                {formatPortalDate(selectedProject.endDate)}
              </span>
              {selectedProject.manager && (
                <span>المدير: {selectedProject.manager.name}</span>
              )}
              <span>{selectedProject.completionPercentage}% مكتمل</span>
            </div>

            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gauge-track">
              <div
                className="h-full rounded-full bg-gauge-fill transition-all"
                style={{ width: `${selectedProject.completionPercentage}%` }}
              />
            </div>

            {/* Project Files */}
            {selectedProject.files && selectedProject.files.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold text-natural-100">
                  ملفات المشروع ({selectedProject.files.length})
                </h3>
                <div className="space-y-2">
                  {selectedProject.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-xl border-[1.5px] border-portal-divider px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-portal-note-text" />
                        <span className="text-sm text-natural-100 truncate">
                          {file.fileName}
                        </span>
                        <span className="text-xs text-portal-note-text shrink-0">
                          ({(file.fileSize / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <a
                        href={file.url || buildPortalFileUrl(file.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <ActionButton
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Download className="h-4 w-4" />
                        </ActionButton>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revision History */}
            {selectedProject.revisionRequests &&
              selectedProject.revisionRequests.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-semibold text-natural-100">
                    طلبات تعديل سابقة
                  </h3>
                  <div className="space-y-2">
                    {selectedProject.revisionRequests.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-xl border-[1.5px] border-portal-divider bg-portal-bg px-3 py-2"
                      >
                        <p className="text-sm text-natural-100">
                          {rev.comment}
                        </p>
                        <p className="mt-1 text-xs text-portal-note-text">
                          {rev.client.companyName} —{" "}
                          {formatPortalDate(rev.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-3">
              {!showRevisionForm && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <ActionButton
                    type="button"
                    variant="primary"
                    size="md"
                    className="h-12 rounded-2xl bg-success-600 text-base font-medium hover:bg-success-700"
                    disabled={isApproving}
                    onClick={() => handleApprove(selectedProject.id)}
                  >
                    <CheckCircle2 className="ml-2 h-5 w-5" />
                    {isApproving ? "جارٍ الموافقة..." : "موافقة على المشروع"}
                  </ActionButton>
                  <ActionButton
                    type="button"
                    variant="outline"
                    size="md"
                    className="h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 text-base font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500"
                    onClick={() => setShowRevisionForm(true)}
                  >
                    <AlertTriangle className="ml-2 h-5 w-5" />
                    طلب تعديلات
                  </ActionButton>
                </div>
              )}

              {showRevisionForm && (
                <div className="rounded-2xl border-[1.5px] border-portal-divider bg-portal-bg p-4">
                  <FormTextarea
                    label="ما التعديلات المطلوبة؟"
                    className="min-h-28"
                    onChange={(e) => setRevisionComment(e.target.value)}
                    placeholder="اكتب تفاصيل التعديلات المطلوبة على المشروع..."
                    rows={4}
                    value={revisionComment}
                  />
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <ActionButton
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 text-xs font-medium text-portal-icon hover:bg-badge-gray-bg"
                      onClick={() => {
                        setShowRevisionForm(false);
                        setRevisionComment("");
                      }}
                    >
                      إلغاء
                    </ActionButton>
                    <ActionButton
                      type="button"
                      variant="primary"
                      size="sm"
                      className="h-9 rounded-xl bg-action-blue px-3 text-xs font-medium hover:bg-action-blue-hover"
                      disabled={isRequestingRevision || !revisionComment.trim()}
                      onClick={() => handleRequestRevision(selectedProject.id)}
                    >
                      {isRequestingRevision
                        ? "جارٍ الإرسال..."
                        : "إرسال طلب التعديل"}
                    </ActionButton>
                  </div>
                </div>
              )}

              <ActionButton
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 text-xs font-medium text-portal-icon hover:bg-badge-gray-bg"
                onClick={() => {
                  setSelectedProjectId(null);
                  setShowRevisionForm(false);
                  setRevisionComment("");
                }}
              >
                إغلاق
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
