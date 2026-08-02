"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderKanban,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import {
  type PmDeliverableWithRevisions,
  useGetPmRevisionsQuery,
} from "@/features/projects/projectsApi";
import { formatShortDate } from "@/lib/format";
import { useAppSelector } from "@/lib/hooks";

type Filter =
  | "all"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "REVISION"
  | "DONE";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "TODO", label: "معلّق" },
  { value: "IN_PROGRESS", label: "قيد التنفيذ" },
  { value: "IN_REVIEW", label: "قيد المراجعة" },
  { value: "REVISION", label: "يحتاج تعديل" },
  { value: "DONE", label: "منجز" },
];

export default function PMChangeRequestsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [filter, setFilter] = useState<Filter>("all");
  const {
    data: deliverables = [],
    isLoading,
    isError,
  } = useGetPmRevisionsQuery(undefined, { skip: user?.role !== "PM" });
  const revisions = useMemo(
    () =>
      deliverables.flatMap((deliverable) =>
        deliverable.revisionRequests.map((revision) => ({
          deliverable,
          revision,
        })),
      ),
    [deliverables],
  );
  const filtered =
    filter === "all"
      ? revisions
      : revisions.filter(({ revision }) => revision.status === filter);
  const counts = revisions.reduce<Record<string, number>>(
    (result, { revision }) => {
      result[revision.status] = (result[revision.status] || 0) + 1;
      return result;
    },
    {},
  );
  const metrics = [
    { label: "المعلّقة", value: counts.TODO || 0, icon: AlertCircle },
    { label: "قيد التنفيذ", value: counts.IN_PROGRESS || 0, icon: Clock },
    {
      label: "قيد المراجعة",
      value: counts.IN_REVIEW || 0,
      icon: ClipboardList,
    },
    { label: "تحتاج تعديل", value: counts.REVISION || 0, icon: AlertCircle },
    { label: "منجزة", value: counts.DONE || 0, icon: CheckCircle2 },
  ];
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
              <ClipboardList />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">طلبات التعديل</CardTitle>
              <CardDescription>
                طلبات التعديل الواردة من العملاء على التسليمات في مشاريعك.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      {!isLoading && !isError && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">
                    {metric.label}
                  </span>
                  <span className="text-2xl font-semibold">{metric.value}</span>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <metric.icon />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>قائمة طلبات التعديل</CardTitle>
            <CardDescription>
              تابع ملاحظات العملاء على تسليمات المشاريع.
            </CardDescription>
          </div>
          {!isLoading && !isError && (
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as Filter)}
            >
              <TabsList className="h-auto flex-wrap">
                {FILTERS.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label} (
                    {item.value === "all"
                      ? revisions.length
                      : counts[item.value] || 0}
                    )
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14" />
              ))}
            </div>
          ) : isError ? (
            <RequestsEmpty
              title="تعذر تحميل طلبات التعديل"
              description="يرجى المحاولة لاحقاً."
            />
          ) : filtered.length === 0 ? (
            <RequestsEmpty
              title="لا توجد طلبات تعديل"
              description="لم يقدم العملاء أي طلبات تعديل على التسليمات بعد."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التسليم</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="text-left">التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ deliverable, revision }) => (
                  <TableRow key={revision.id}>
                    <TableCell>
                      <span className="font-medium">{deliverable.title}</span>
                    </TableCell>
                    <TableCell>
                      {deliverable.project?.name || "مشروع غير معروف"}
                    </TableCell>
                    <TableCell className="max-w-72 truncate">
                      {revision.requestDescription}
                    </TableCell>
                    <TableCell>{revision.client?.companyName || "-"}</TableCell>
                    <TableCell>
                      <PmStatusBadge
                        domain="revision"
                        status={revision.status}
                      />
                    </TableCell>
                    <TableCell dir="ltr">
                      {formatShortDate(revision.createdAt)}
                    </TableCell>
                    <TableCell className="text-left">
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          href={`/dashboard/pm/projects/${deliverable.project?.id ?? deliverable.projectId}`}
                        >
                          <ArrowUpRight />
                          فتح
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
function RequestsEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderKanban />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
