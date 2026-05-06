"use client";

import { useMemo, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetDeliverablesByClientQuery,
  useCreateRevisionMutation,
} from "@/features/deliverables/deliverablesApi";
import { useGetProjectProgressQuery } from "@/features/portal/portalApi";
import { Download, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalFilePreview } from "@/components/portal/PortalFilePreview";
import { PortalMetricCard } from "@/components/portal/PortalMetricCard";
import { PortalPageIntro } from "@/components/portal/PortalPageIntro";
import {
  PortalPill,
  type PortalPillTone,
} from "@/components/portal/PortalPill";
import { PortalProgressCard } from "@/components/portal/PortalProgressCard";
import { PortalShowcaseCard } from "@/components/portal/PortalShowcaseCard";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { buildPortalFileUrl, getPortalFileKindLabel } from "@/lib/portal-files";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  TODO: "معلّق",
  IN_PROGRESS: "جارٍ",
  IN_REVIEW: "مراجعة",
  DONE: "معتمد",
  REVISION: "يحتاج تعديل",
};

const STATUS_TONES: Record<string, PortalPillTone> = {
  TODO: "neutral",
  IN_PROGRESS: "warning",
  IN_REVIEW: "warning",
  DONE: "success",
  REVISION: "purple",
};

function formatPortalDate(date?: string | null) {
  if (!date) {
    return null;
  }

  return new Date(date).toLocaleDateString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getRevisionCountLabel(count: number) {
  if (count <= 0) {
    return null;
  }

  return count === 1 ? "طلب تعديل واحد" : `${count} طلبات تعديل`;
}

export default function PortalDeliverablesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const {
    data: deliverables,
    isLoading,
    isError,
  } = useGetDeliverablesByClientQuery(clientId, {
    skip: !clientId,
  });
  const { data: projectProgress } = useGetProjectProgressQuery(undefined, {
    skip: !clientId,
  });
  const [createRevision] = useCreateRevisionMutation();

  const [revisionFor, setRevisionFor] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitRevision(deliverableId: string) {
    if (!revisionText.trim()) return;
    setSubmitting(true);
    try {
      await createRevision({
        deliverableId,
        body: { description: revisionText },
      }).unwrap();
      setRevisionFor(null);
      setRevisionText("");
    } finally {
      setSubmitting(false);
    }
  }

  const visible = useMemo(
    () =>
      deliverables?.filter((deliverable) => deliverable.isVisibleToClient) ??
      [],
    [deliverables],
  );

  const metrics = useMemo(() => {
    const total = visible.length;
    const completed = visible.filter(
      (deliverable) => deliverable.status === "DONE",
    ).length;
    const inReview = visible.filter(
      (deliverable) => deliverable.status === "IN_REVIEW",
    ).length;
    const openRevisionRequests = visible.reduce(
      (totalRevisions, deliverable) => {
        if (deliverable.revisionRequests?.length) {
          return (
            totalRevisions +
            deliverable.revisionRequests.filter(
              (revision) => !revision.resolvedAt,
            ).length
          );
        }

        return deliverable.status === "REVISION"
          ? totalRevisions + 1
          : totalRevisions;
      },
      0,
    );

    const progressValue =
      projectProgress?.overallProgress ??
      (total > 0 ? Math.round((completed / total) * 100) : 0);

    const nextDeadline = projectProgress?.projects
      ?.map((project) => project.endDate)
      .filter(Boolean)
      .sort(
        (left, right) => new Date(left).getTime() - new Date(right).getTime(),
      )[0];

    return {
      total,
      completed,
      inReview,
      openRevisionRequests,
      progressValue,
      nextDeadline,
    };
  }, [projectProgress, visible]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PortalPageIntro
        title="الأعمال والتسليمات"
        description="جميع ما تم تسليمه أو العمل عليه في مشروعك ضمن نظام موحّد يمكن إعادة استخدامه لاحقاً في أي صفحة تعتمد نفس تجربة العميل."
        icon={PackageOpen}
      />

      {!clientId && (
        <PortalSurfaceCard title="تعذر تحميل التسليمات" icon={PackageOpen}>
          <p className="text-sm leading-6 text-portal-note-text">
            لم يتم ربط حسابك بملف عميل.
          </p>
        </PortalSurfaceCard>
      )}

      {clientId && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PortalMetricCard
              title="إجمالي التسليمات"
              value={metrics.total}
              pillText="خلال المشروع"
              pillTone="neutral"
            />
            <PortalMetricCard
              title="مكتمل ومعتمد"
              value={metrics.completed}
              pillText="جاهزة للتحميل"
              pillTone="success"
            />
            <PortalMetricCard
              title="قيد المراجعة"
              value={metrics.inReview}
              pillText="في انتظار ردك"
              pillTone="warning"
            />
            <PortalMetricCard
              title="طلبات التعديل"
              value={metrics.openRevisionRequests}
              pillText="مفتوحة"
              pillTone="purple"
            />
          </div>

          <PortalProgressCard
            title="تقدم المشروع"
            value={metrics.progressValue}
            max={100}
            summary={`${metrics.completed} من ${metrics.total || 0} تسليم مكتمل`}
            caption={
              metrics.nextDeadline
                ? `تاريخ الانتهاء: ${formatPortalDate(metrics.nextDeadline)}`
                : "سيظهر موعد التسليم التالي عند توفره"
            }
          />

          <PortalSurfaceCard
            title="قائمة التسليمات"
            description="تم بناء هذه الصفحة من مكونات قابلة لإعادة الاستخدام: بطاقات الإحصاءات، لوحة التقدم، بطاقات العرض، ومعاينات الملفات."
            icon={PackageOpen}
          >
            {isLoading && (
              <div className="grid gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="space-y-4 rounded-[30px] border-[1.5px] border-portal-divider bg-portal-bg p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                        <Skeleton className="h-5 w-64 rounded-lg" />
                      </div>
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 3 }).map((__, previewIndex) => (
                        <Skeleton
                          key={previewIndex}
                          className="h-40 rounded-3xl"
                        />
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Skeleton className="h-12 rounded-2xl" />
                      <Skeleton className="h-12 rounded-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-3xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-6 text-center">
                <p className="text-base font-medium text-danger-700">
                  حدث خطأ أثناء تحميل التسليمات.
                </p>
                <p className="mt-2 text-sm text-danger-600">
                  يرجى المحاولة لاحقاً أو تحديث الصفحة.
                </p>
              </div>
            )}

            {!isLoading && !isError && visible.length === 0 && (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
                  <PackageOpen className="h-8 w-8 text-secondary-500" />
                </div>
                <p className="text-lg font-medium text-natural-100">
                  لا توجد تسليمات متاحة حالياً.
                </p>
                <p className="max-w-md text-sm leading-6 text-portal-note-text">
                  ستظهر هنا الأعمال الجاهزة للعرض أو التحميل بمجرد إضافتها
                  وإتاحتها لك من فريق المشروع.
                </p>
              </div>
            )}

            {!isLoading && !isError && visible.length > 0 && (
              <div className="grid gap-4 xl:grid-cols-2">
                {visible.map((item) => {
                  const createdAt = formatPortalDate(item.createdAt);
                  const approvedAt = formatPortalDate(item.approvedAt);
                  const fileUrl = buildPortalFileUrl(item.filePath);
                  const revisionCount =
                    item.revisionRequests?.filter(
                      (revision) => !revision.resolvedAt,
                    ).length ?? 0;

                  return (
                    <PortalShowcaseCard
                      key={item.id}
                      title={item.title}
                      status={
                        <PortalPill
                          tone={STATUS_TONES[item.status] ?? "neutral"}
                        >
                          {STATUS_LABELS[item.status] ?? item.status}
                        </PortalPill>
                      }
                      meta={
                        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm leading-6 text-portal-note-text">
                          {createdAt ? (
                            <span>{`سُلّم ${createdAt}`}</span>
                          ) : null}
                          {approvedAt ? (
                            <span>{`اعتمد ${approvedAt}`}</span>
                          ) : null}
                          {item.project?.name ? (
                            <span>{item.project.name}</span>
                          ) : null}
                          <span>{`1 ${getPortalFileKindLabel(item.filePath)}`}</span>
                          {getRevisionCountLabel(revisionCount) ? (
                            <span>{getRevisionCountLabel(revisionCount)}</span>
                          ) : null}
                        </div>
                      }
                      body={
                        item.description ? (
                          <p className="text-sm leading-7 text-black/70">
                            {item.description}
                          </p>
                        ) : null
                      }
                      preview={
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <PortalFilePreview
                            filePath={item.filePath}
                            title={item.title}
                          />
                        </div>
                      }
                      footer={
                        <>
                          <div
                            className={cn(
                              "grid gap-3",
                              item.status !== "DONE"
                                ? "sm:grid-cols-2"
                                : "sm:grid-cols-1",
                            )}
                          >
                            {item.status !== "DONE" && (
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-5 text-base font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500"
                                onClick={() =>
                                  setRevisionFor(
                                    revisionFor === item.id ? null : item.id,
                                  )
                                }
                              >
                                طلب تعديل
                              </Button>
                            )}

                            <Button
                              asChild
                              className="h-12 rounded-2xl bg-secondary-500 px-5 text-base font-medium hover:bg-secondary-600"
                            >
                              <a
                                href={fileUrl}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                <Download className="ml-2 h-4 w-4" />
                                تحميل
                              </a>
                            </Button>
                          </div>

                          {revisionFor === item.id && (
                            <div className="mt-4 rounded-3xl border-[1.5px] border-portal-divider bg-portal-bg p-4">
                              <div className="space-y-3">
                                <Textarea
                                  className="min-h-28 rounded-3xl border-portal-card-border bg-natural-0 px-4 py-3 text-sm leading-7"
                                  onChange={(event) =>
                                    setRevisionText(event.target.value)
                                  }
                                  placeholder="اكتب تفاصيل التعديل المطلوب..."
                                  rows={4}
                                  value={revisionText}
                                />

                                <div className="flex flex-wrap justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-11 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-4 text-sm font-medium text-portal-icon hover:bg-badge-gray-bg"
                                    onClick={() => {
                                      setRevisionFor(null);
                                      setRevisionText("");
                                    }}
                                  >
                                    إلغاء
                                  </Button>

                                  <Button
                                    type="button"
                                    className="h-11 rounded-2xl bg-action-blue px-4 text-sm font-medium hover:bg-action-blue-hover"
                                    disabled={
                                      submitting || !revisionText.trim()
                                    }
                                    onClick={() => submitRevision(item.id)}
                                  >
                                    {submitting
                                      ? "جارٍ الإرسال..."
                                      : "إرسال الطلب"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      }
                    />
                  );
                })}
              </div>
            )}
          </PortalSurfaceCard>
        </>
      )}
    </div>
  );
}
